/**
 * 公開コンテンツ取得 API
 *
 * GET /api/public/content - 認証不要、front からの取得用
 *
 * TODO: プロジェクトに応じてコンテンツ型を調整
 */

import type { APIRoute } from 'astro';
import type { Env, ApiResponse } from '../../../lib/types';
// TODO: r2.ts のコンテンツキーを設定後、以下を有効化
// import { getContent } from '../../../lib/r2';

/**
 * CORS ヘッダーを追加
 */
function corsHeaders(origin?: string | null): Record<string, string> {
  // TODO: 本番環境のドメインを追加
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
  const _env = locals.runtime.env as Env;
  const origin = request.headers.get('Origin');

  try {
    // TODO: 実装
    // コンテンツを取得してレスポンス
    //
    // 実装例:
    // const [calendar, limited] = await Promise.all([
    //   getContent<CalendarContent>(env, 'calendar'),
    //   getContent<LimitedMenuContent>(env, 'limited'),
    // ]);
    //
    // // 画像URLをフルパスに変換
    // const baseUrl = new URL(request.url).origin;
    // const data = {
    //   calendar: calendar ? {
    //     ...calendar,
    //     imageUrl: `${baseUrl}/${calendar.imageUrl.replace(/^\//, '')}`,
    //   } : null,
    // };

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Not implemented - configure r2.ts CONTENT_KEY first',
      } satisfies ApiResponse),
      {
        status: 501,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(origin),
        },
      }
    );
  } catch (error) {
    console.error('Public content API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch content',
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
