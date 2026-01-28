/**
 * DynamicIsland - 動的コンテンツを表示するPreact Island
 *
 * SSG（静的生成）されたページ上で、クライアントサイドで
 * admin API からコンテンツを取得して表示するコンポーネント。
 *
 * 使用方法:
 * ```astro
 * ---
 * import DynamicIsland from '../components/DynamicIsland';
 * ---
 * <DynamicIsland
 *   client:load
 *   adminApiUrl="https://your-admin.pages.dev"
 *   contentType="sample-image-text"
 *   baseUrl={Astro.site?.origin || ''}
 * />
 * ```
 */
import { useState, useEffect } from 'preact/hooks';
import type { SampleImageContent, SampleImageTextContent, OgpContent, PublicContent } from '../lib/content';

type ContentType = 'sample-image' | 'sample-image-text' | 'ogp';

interface Props {
  /** Admin API のベースURL（末尾スラッシュなし） */
  adminApiUrl: string;
  /** 取得するコンテンツタイプ */
  contentType: ContentType;
  /** フォールバック画像用のベースURL */
  baseUrl: string;
}

interface ApiResponse {
  success: boolean;
  data?: PublicContent;
}

export default function DynamicIsland({ adminApiUrl, contentType, baseUrl }: Props) {
  const [content, setContent] = useState<SampleImageContent | SampleImageTextContent | OgpContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${adminApiUrl}/api/public/content`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('API error');
        const json = (await response.json()) as ApiResponse;
        if (json.success && json.data?.[contentType]) {
          setContent(json.data[contentType]);
        }
      } catch (err) {
        console.error(`Failed to fetch ${contentType} content:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [adminApiUrl, contentType]);

  // ローディング中はスケルトン表示
  if (loading) {
    return (
      <div class="dynamic-island dynamic-island--loading">
        <div class="dynamic-island__skeleton" />
      </div>
    );
  }

  // エラー時またはコンテンツなしの場合
  if (error || !content) {
    return (
      <div class="dynamic-island dynamic-island--empty">
        <p>コンテンツを読み込めませんでした</p>
      </div>
    );
  }

  // コンテンツタイプに応じた表示
  if (contentType === 'sample-image') {
    const imageContent = content as SampleImageContent;
    return (
      <div class="dynamic-island dynamic-island--sample-image">
        <img
          src={imageContent.imageUrl || `${baseUrl}/placeholder.webp`}
          alt="サンプル画像"
          class="dynamic-island__image"
          loading="lazy"
        />
      </div>
    );
  }

  if (contentType === 'sample-image-text') {
    const textContent = content as SampleImageTextContent;
    return (
      <div class="dynamic-island dynamic-island--sample-image-text">
        <img
          src={textContent.imageUrl || `${baseUrl}/placeholder.webp`}
          alt={textContent.title || 'サンプル画像'}
          class="dynamic-island__image"
          loading="lazy"
        />
        {textContent.title && (
          <h3 class="dynamic-island__title">{textContent.title}</h3>
        )}
        {textContent.description && (
          <p
            class="dynamic-island__description"
            dangerouslySetInnerHTML={{ __html: textContent.description.replace(/\n/g, '<br>') }}
          />
        )}
      </div>
    );
  }

  // OGP（通常は表示用ではないが、デバッグ用に実装）
  if (contentType === 'ogp') {
    const ogpContent = content as OgpContent;
    return (
      <div class="dynamic-island dynamic-island--ogp">
        <div class="dynamic-island__card">
          <img
            src={ogpContent.imageUrl || `${baseUrl}/placeholder.webp`}
            alt="OGP画像"
            class="dynamic-island__card-image"
            loading="lazy"
          />
          <div class="dynamic-island__card-body">
            <p class="dynamic-island__card-title">{ogpContent.title}</p>
            <p class="dynamic-island__card-description">{ogpContent.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
