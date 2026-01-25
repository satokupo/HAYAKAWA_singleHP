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
 * API レスポンス
 */
interface ApiResponse {
  success: boolean;
  data?: {
    calendar: CalendarContent | null;
    limited: LimitedMenuContent | null;
  };
  error?: string;
}

/**
 * デフォルト値（API取得失敗時のフォールバック）
 */
export const DEFAULT_LIMITED: LimitedMenuContent = {
  title: '栗と鶏肉の甘辛餃子',
  description: 'ほっくり甘い栗と、ジューシーな鶏肉を甘辛く仕上げました。',
  imageUrl: '', // 静的画像を使用
  updatedAt: '',
};

export const DEFAULT_CALENDAR: CalendarContent = {
  imageUrl: '', // 静的画像を使用
  month: '',
  updatedAt: '',
};

/**
 * admin API からコンテンツを取得
 */
export async function fetchContent(adminApiUrl: string): Promise<{
  calendar: CalendarContent | null;
  limited: LimitedMenuContent | null;
}> {
  try {
    const response = await fetch(`${adminApiUrl}/api/public/content`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return { calendar: null, limited: null };
    }

    const json = (await response.json()) as ApiResponse;

    if (!json.success || !json.data) {
      console.error('API returned unsuccessful response');
      return { calendar: null, limited: null };
    }

    return json.data;
  } catch (error) {
    console.error('Failed to fetch content from admin API:', error);
    return { calendar: null, limited: null };
  }
}
