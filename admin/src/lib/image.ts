/**
 * 画像処理
 * JPEG/PNG/HEIC → WebP 変換、リサイズ
 *
 * 注意: Cloudflare Workers環境では画像処理に制限がある
 * 本番環境では Cloudflare Images や外部サービスの利用を検討
 */

/** 最大長辺サイズ（px） */
const MAX_DIMENSION = 2000;

/** サポートするMIMEタイプ */
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * 画像を処理（リサイズ + WebP変換）
 *
 * Workers環境での画像処理は制限があるため、
 * クライアントサイドでの前処理を推奨
 *
 * @param file アップロードされたファイル
 * @returns 処理済みの画像データ
 */
export async function processImage(
  file: File
): Promise<{ data: ArrayBuffer; width: number; height: number }> {
  // MIMEタイプチェック
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error(
      `サポートされていない画像形式です。対応形式: JPEG, PNG, WebP, HEIC`
    );
  }

  // ファイルサイズチェック（10MB制限）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('ファイルサイズは10MB以下にしてください。');
  }

  // Workers環境ではネイティブの画像処理が制限されているため、
  // 画像データをそのまま返し、実際の変換はクライアント側で行う
  // または Cloudflare Images を利用する

  const data = await file.arrayBuffer();

  return {
    data,
    width: 0, // クライアント側で取得
    height: 0,
  };
}

/**
 * 画像の基本情報を検証
 */
export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  // MIMEタイプチェック
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `サポートされていない画像形式です。対応形式: JPEG, PNG, WebP, HEIC`,
    };
  }

  // ファイルサイズチェック（10MB制限）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'ファイルサイズは10MB以下にしてください。',
    };
  }

  return { valid: true };
}

/**
 * クライアントサイドで画像をリサイズしてWebPに変換するためのヘルパー
 * ブラウザで実行されるJavaScriptコード
 */
export const clientImageProcessorCode = `
async function processImageOnClient(file, maxDimension = ${MAX_DIMENSION}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;

      // リサイズ計算
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // WebPに変換
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width, height });
          } else {
            reject(new Error('画像の変換に失敗しました'));
          }
        },
        'image/webp',
        0.85 // 品質
      );
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));

    // HEIC対応: ブラウザがHEICをサポートしていない場合はエラー
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      reject(new Error('HEICファイルは事前にJPEGに変換してください'));
      return;
    }

    img.src = URL.createObjectURL(file);
  });
}
`;
