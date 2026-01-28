/**
 * CalendarIsland - 営業カレンダーのクライアントコンポーネント
 * SSG化に伴い、動的コンテンツをクライアントサイドでfetchする
 */
import { useState, useEffect } from 'preact/hooks';
import type { CalendarContent } from '../lib/content';
import { getAdminApiUrl } from '../config/environments';

interface Props {
  baseUrl: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    calendar: CalendarContent | null;
  };
}

export default function CalendarIsland({ baseUrl }: Props) {
  const [content, setContent] = useState<CalendarContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const adminApiUrl = getAdminApiUrl();
        const response = await fetch(`${adminApiUrl}/api/public/content`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('API error');
        const json = (await response.json()) as ApiResponse;
        if (json.success && json.data?.calendar) {
          setContent(json.data.calendar);
        }
      } catch (err) {
        console.error('Failed to fetch calendar content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  const imageUrl = content?.imageUrl || `${baseUrl}placeholder.webp`;

  // ローディング中はスケルトン表示
  if (loading) {
    return (
      <div class="shop__calendar">
        <div class="shop__calendar-image shop__calendar-image--skeleton" />
      </div>
    );
  }

  return (
    <div class="shop__calendar">
      <img
        src={imageUrl}
        alt="営業カレンダー"
        class="shop__calendar-image"
        width="280"
        height="200"
        loading="lazy"
      />
    </div>
  );
}
