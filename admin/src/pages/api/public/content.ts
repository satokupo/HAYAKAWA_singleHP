/**
 * 公開コンテンツ取得 API
 *
 * GET /api/public/content - 認証不要、site からの取得用
 */

import type { APIRoute } from 'astro';
import type {
  Env,
  ApiResponse,
  CalendarContent,
  LimitedMenuContent,
} from '../../../lib/types';
import { getContent } from '../../../lib/r2';

/**
 * CORS ヘッダーを追加
 */
function corsHeaders(origin?: string | null): Record<string, string> {
  // 開発環境: localhost からのアクセスを許可
  // 本番環境: site のドメインからのアクセスを許可
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4321',
    'http://localhost:8789',
    'https://hayakawa-gyoza.com',
    'https://www.hayakawa-gyoza.com',
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
    // カレンダーと限定メニューの両方を取得
    const [calendar, limited] = await Promise.all([
      getContent<CalendarContent>(env, 'calendar'),
      getContent<LimitedMenuContent>(env, 'limited'),
    ]);

    // 画像URLをフルパスに変換
    const baseUrl = new URL(request.url).origin;

    const data = {
      calendar: calendar
        ? {
            ...calendar,
            imageUrl: calendar.imageUrl.startsWith('http')
              ? calendar.imageUrl
              : `${baseUrl}/${calendar.imageUrl.replace(/^\//, '')}`,
          }
        : null,
      limited: limited
        ? {
            ...limited,
            imageUrl: limited.imageUrl.startsWith('http')
              ? limited.imageUrl
              : `${baseUrl}/${limited.imageUrl.replace(/^\//, '')}`,
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
