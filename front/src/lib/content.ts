/**
 * admin API からコンテンツを取得するユーティリティ
 */

/**
 * 限定メニューコンテンツ
 */
export interface LimitedMenuContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}

/**
 * カレンダーコンテンツ
 */
export interface CalendarContent {
  imageUrl: string;
  month: string;
  updatedAt: string;
}

/**
 * OGPコンテンツ
 */
export interface OgpContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}

/**
 * API レスポンス
 */
interface ApiResponse {
  success: boolean;
  data?: {
    calendar: CalendarContent | null;
    limited: LimitedMenuContent | null;
    ogp: OgpContent | null;
  };
  error?: string;
}

/**
 * デフォルト値（API取得失敗時のフォールバック）
 * 注意: 古いメニュー/カレンダーが表示されないよう、準備中の表示にする
 */
export const DEFAULT_LIMITED: LimitedMenuContent = {
  title: '',
  description: '',
  imageUrl: '', // セクションでplaceholder/placeholder.webpにフォールバック
  updatedAt: '',
};

export const DEFAULT_CALENDAR: CalendarContent = {
  imageUrl: '', // セクションでplaceholder/placeholder.webpにフォールバック
  month: '',
  updatedAt: '',
};

// OGPデフォルト値はsite.tsで一元管理
// 後方互換のため再エクスポート（将来的には直接site.tsを参照に移行）
import { DEFAULT_OGP } from '../config/site';
export { DEFAULT_OGP };

/**
 * admin API からコンテンツを取得
 */
export async function fetchContent(adminApiUrl: string): Promise<{
  calendar: CalendarContent | null;
  limited: LimitedMenuContent | null;
  ogp: OgpContent | null;
}> {
  try {
    const response = await fetch(`${adminApiUrl}/api/public/content`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return { calendar: null, limited: null, ogp: null };
    }

    const json = (await response.json()) as ApiResponse;

    if (!json.success || !json.data) {
      console.error('API returned unsuccessful response');
      return { calendar: null, limited: null, ogp: null };
    }

    return json.data;
  } catch (error) {
    console.error('Failed to fetch content from admin API:', error);
    return { calendar: null, limited: null, ogp: null };
  }
}
