/**
 * Admin API 連携
 * admin/ の公開APIからコンテンツを取得
 *
 * 使用例:
 *   const content = await fetchContent('https://your-admin.pages.dev');
 */

/**
 * コンテンツ型定義
 * admin/src/lib/types.ts と同期させること
 */

/**
 * 画像のみコンテンツ（sample-image）
 */
export interface SampleImageContent {
  imageUrl: string;
  updatedAt: string;
}

/**
 * 画像+テキストコンテンツ（sample-image-text）
 */
export interface SampleImageTextContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}

/**
 * OGPコンテンツ（ogp）
 */
export interface OgpContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}

/**
 * 公開コンテンツ
 */
export interface PublicContent {
  'sample-image': SampleImageContent | null;
  'sample-image-text': SampleImageTextContent | null;
  ogp: OgpContent | null;
}

/**
 * API レスポンス
 */
interface ApiResponse {
  success: boolean;
  data?: PublicContent;
  error?: string;
}

/**
 * デフォルト値（API取得失敗時のフォールバック）
 * 注意: 古いコンテンツが表示されないよう、空文字にする
 */
export const DEFAULT_SAMPLE_IMAGE: SampleImageContent = {
  imageUrl: '', // セクションでplaceholder.webpにフォールバック
  updatedAt: '',
};

export const DEFAULT_SAMPLE_IMAGE_TEXT: SampleImageTextContent = {
  title: '',
  description: '',
  imageUrl: '', // セクションでplaceholder.webpにフォールバック
  updatedAt: '',
};

export const DEFAULT_OGP: OgpContent = {
  title: 'サンプル店舗',
  description: 'サンプル店舗の説明文です。',
  imageUrl: '', // Base.astro でデフォルト画像にフォールバック
  updatedAt: '',
};

/**
 * Admin API からコンテンツを取得
 *
 * @param adminBaseUrl - Admin サイトのベースURL（末尾スラッシュなし）
 * @returns 公開コンテンツ
 * @throws API通信エラー時
 *
 * @example
 * // 開発環境
 * const content = await fetchContent('http://localhost:8788');
 *
 * // 本番環境
 * const content = await fetchContent('https://your-admin.pages.dev');
 */
export async function fetchContent(adminBaseUrl: string): Promise<PublicContent> {
  const response = await fetch(`${adminBaseUrl}/api/public/content`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status}`);
  }

  const json = await response.json() as ApiResponse;

  if (!json.success || !json.data) {
    throw new Error(json.error || 'Unknown error');
  }

  return json.data;
}

/**
 * コンテンツ取得（エラー時はnullを返す）
 *
 * @example
 * const content = await fetchContentSafe('https://your-admin.pages.dev');
 * if (content?.['sample-image']) {
 *   // 画像を表示
 * }
 */
export async function fetchContentSafe(
  adminBaseUrl: string
): Promise<PublicContent | null> {
  try {
    return await fetchContent(adminBaseUrl);
  } catch (error) {
    console.error('Content fetch error:', error);
    return null;
  }
}
