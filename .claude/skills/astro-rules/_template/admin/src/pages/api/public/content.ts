/**
 * 公開コンテンツ取得 API
 *
 * GET /api/public/content - 認証不要、front からの取得用
 *
 * 3タイプを一括取得して返す:
 * - sample-image: 画像のみ
 * - sample-image-text: 画像+テキスト
 * - ogp: OGPカード情報
 */

import type { APIRoute } from 'astro';
import type {
  Env,
  ApiResponse,
  SampleImageContent,
  SampleImageTextContent,
  OgpContent,
} from '../../../lib/types';
import { getContent } from '../../../lib/r2';

/**
 * CORS ヘッダーを追加
 */
function corsHeaders(origin?: string | null): Record<string, string> {
  // 開発環境: localhost からのアクセスを許可
  // 本番環境: front のドメインからのアクセスを許可（要カスタマイズ）
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4321',
    'http://localhost:8788',
    // 'https://your-front.pages.dev',
    // 'https://your-domain.com',
  ];

  const responseOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * OPTIONS リクエスト（CORS プリフライト）
 */
export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
};

/**
 * 公開コンテンツ取得（認証不要）
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  const origin = request.headers.get('Origin');

  try {
    // 3タイプを一括取得
    const [sampleImage, sampleImageText, ogp] = await Promise.all([
      getContent<SampleImageContent>(env, 'sample-image'),
      getContent<SampleImageTextContent>(env, 'sample-image-text'),
      getContent<OgpContent>(env, 'ogp'),
    ]);

    // 画像URLをフルパスに変換
    const baseUrl = new URL(request.url).origin;

    const data = {
      'sample-image': sampleImage
        ? {
            ...sampleImage,
            imageUrl: sampleImage.imageUrl.startsWith('http')
              ? sampleImage.imageUrl
              : `${baseUrl}/${sampleImage.imageUrl.replace(/^\//, '')}`,
          }
        : null,
      'sample-image-text': sampleImageText
        ? {
            ...sampleImageText,
            imageUrl: sampleImageText.imageUrl.startsWith('http')
              ? sampleImageText.imageUrl
              : `${baseUrl}/${sampleImageText.imageUrl.replace(/^\//, '')}`,
          }
        : null,
      ogp: ogp
        ? {
            ...ogp,
            imageUrl: ogp.imageUrl.startsWith('http')
              ? ogp.imageUrl
              : `${baseUrl}/${ogp.imageUrl.replace(/^\//, '')}`,
          }
        : null,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data,
      } satisfies ApiResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60', // 1分キャッシュ
          ...corsHeaders(origin),
        },
      }
    );
  } catch (error) {
    console.error('Public content API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'コンテンツの取得に失敗しました。',
      } satisfies ApiResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      }
    );
  }
};
