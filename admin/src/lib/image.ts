/**
 * 画像処理
 * JPEG/WebP → WebP変換、PNG → PNG維持、HEIC → WebP変換
 * リサイズは長辺2000px
 *
 * 注意: Cloudflare Workers環境では画像処理に制限がある
 * クライアントサイドでの前処理を推奨
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
 * 画像を処理（リサイズ + 形式変換）
 *
 * Workers環境での画像処理は制限があるため、
 * クライアントサイドでの前処理を推奨
 *
 * @param file アップロードされたファイル
 * @returns 処理済みの画像データ
 */
export async function processImage(
  file: File
): Promise<{ data: ArrayBuffer; width: number; height: number; isPng: boolean }> {
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

  const data = await file.arrayBuffer();
  const isPng = file.type === 'image/png';

  return {
    data,
    width: 0, // クライアント側で取得
    height: 0,
    isPng,
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
 * クライアントサイドで画像をリサイズ・変換するためのヘルパー
 * ブラウザで実行されるJavaScriptコード
 *
 * - PNG → PNGのまま維持
 * - JPEG/WebP → WebPに変換
 * - HEIC → WebPに変換（heic2any使用）
 */
/** OGP画像サイズ */
const OGP_WIDTH = 1200;
const OGP_HEIGHT = 630;

export const clientImageProcessorCode = `
async function processImageOnClient(file, maxDimension = ${MAX_DIMENSION}) {
  // HEICの場合はheic2anyで変換
  let processFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    if (typeof heic2any === 'undefined') {
      throw new Error('HEIC変換ライブラリが読み込まれていません');
    }
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    processFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  }

  const isPng = file.type === 'image/png';

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

      // PNG → PNG、それ以外 → WebP
      const outputType = isPng ? 'image/png' : 'image/webp';
      const quality = isPng ? undefined : 0.85;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width, height, isPng });
          } else {
            reject(new Error('画像の変換に失敗しました'));
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(processFile);
  });
}
`;

/**
 * OGP画像用のクライアントサイド処理コード
 * 1200x630px に中央トリミング（cover）して WebP に変換
 */
export const clientOgpImageProcessorCode = `
async function processOgpImageOnClient(file) {
  const OGP_WIDTH = ${OGP_WIDTH};
  const OGP_HEIGHT = ${OGP_HEIGHT};

  // HEICの場合はheic2anyで変換
  let processFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    if (typeof heic2any === 'undefined') {
      throw new Error('HEIC変換ライブラリが読み込まれていません');
    }
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    processFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      const { width: srcW, height: srcH } = img;

      // cover方式で中央トリミング
      const targetRatio = OGP_WIDTH / OGP_HEIGHT;
      const srcRatio = srcW / srcH;

      let sw, sh, sx, sy;
      if (srcRatio > targetRatio) {
        // 横長 → 左右をトリミング
        sh = srcH;
        sw = srcH * targetRatio;
        sx = (srcW - sw) / 2;
        sy = 0;
      } else {
        // 縦長 → 上下をトリミング
        sw = srcW;
        sh = srcW / targetRatio;
        sx = 0;
        sy = (srcH - sh) / 2;
      }

      canvas.width = OGP_WIDTH;
      canvas.height = OGP_HEIGHT;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OGP_WIDTH, OGP_HEIGHT);

      // OGP画像は常にWebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, width: OGP_WIDTH, height: OGP_HEIGHT, isPng: false });
          } else {
            reject(new Error('画像の変換に失敗しました'));
          }
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(processFile);
  });
}
`;
