/**
 * LimitedIsland - 今月の餃子セクションのクライアントコンポーネント
 * SSG化に伴い、動的コンテンツをクライアントサイドでfetchする
 */
import { useState, useEffect } from 'preact/hooks';
import type { LimitedMenuContent } from '../lib/content';
import { getAdminApiUrl } from '../config/environments';

interface Props {
  baseUrl: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    limited: LimitedMenuContent | null;
  };
}

export default function LimitedIsland({ baseUrl }: Props) {
  const [content, setContent] = useState<LimitedMenuContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(false);

  useEffect(() => {
    const fetchLimited = async () => {
      try {
        const adminApiUrl = getAdminApiUrl();
        const response = await fetch(`${adminApiUrl}/api/public/content`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('API error');
        const json = (await response.json()) as ApiResponse;
        if (json.success && json.data?.limited) {
          setContent(json.data.limited);
        }
      } catch (err) {
        console.error('Failed to fetch limited content:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLimited();
  }, []);

  // デフォルト値（データなし時のプレースホルダー）
  const title = content?.title || '準備中';
  const description = content?.description || 'Coming Soon...';
  const imageUrl = content?.imageUrl || `${baseUrl}placeholder.webp`;

  // ローディング中はスケルトン表示
  if (loading) {
    return (
      <div class="limited__content">
        <h2 class="limited__title">今月の餃子</h2>
        <div class="limited__image-wrapper">
          <svg class="limited__decoration" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r="105"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-dasharray="8 6"
            />
          </svg>
          <div class="limited__image limited__image--skeleton" />
        </div>
        <p class="limited__name limited__name--skeleton">&nbsp;</p>
        <p class="limited__description limited__description--skeleton">&nbsp;</p>
      </div>
    );
  }

  // エラー時またはコンテンツなしでもフォールバック表示
  return (
    <div class="limited__content">
      <h2 class="limited__title">今月の餃子</h2>
      <div class="limited__image-wrapper">
        <svg class="limited__decoration" viewBox="0 0 220 220">
          <circle
            cx="110"
            cy="110"
            r="105"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-dasharray="8 6"
          />
        </svg>
        <img
          src={imageUrl}
          alt="今月の餃子"
          class="limited__image"
          width="300"
          height="300"
          loading="lazy"
        />
      </div>
      <p class="limited__name">{title}</p>
      <p
        class="limited__description"
        dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, '<br>') }}
      />
    </div>
  );
}
