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
export interface CalendarContent {
  imageUrl: string;
  month: string;
  updatedAt: string;
}

export interface LimitedMenuContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}

export interface PublicContent {
  calendar: CalendarContent | null;
  limited: LimitedMenuContent | null;
}

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

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'Unknown error');
  }

  return json.data as PublicContent;
}

/**
 * コンテンツ取得（エラー時はnullを返す）
 *
 * @example
 * const content = await fetchContentSafe('https://your-admin.pages.dev');
 * if (content?.calendar) {
 *   // カレンダーを表示
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
