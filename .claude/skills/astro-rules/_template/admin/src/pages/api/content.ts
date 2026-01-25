/**
 * コンテンツ取得・更新 API
 *
 * GET /api/content?type=xxx - コンテンツ取得（認証必要）
 * POST /api/content - コンテンツ更新（認証必要）
 *
 * TODO: プロジェクトに応じてコンテンツ型を調整
 */

import type { APIRoute } from 'astro';
import type { Env, ApiResponse } from '../../lib/types';
import { validateSession } from '../../lib/session';
// TODO: r2.ts のコンテンツキーを設定後、以下を有効化
// import { getContent, saveContent } from '../../lib/r2';

/**
 * コンテンツ取得
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;

  // 認証チェック
  const cookieHeader = request.headers.get('Cookie');
  const userAgent = request.headers.get('User-Agent') || undefined;
  const session = await validateSession(env, cookieHeader, userAgent);

  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // TODO: 実装
  // const url = new URL(request.url);
  // const type = url.searchParams.get('type');
  // const content = await getContent(env, type as ContentType);

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Not implemented - configure r2.ts CONTENT_KEY first',
    } satisfies ApiResponse),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

/**
 * コンテンツ更新
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;

  // 認証チェック
  const cookieHeader = request.headers.get('Cookie');
  const userAgent = request.headers.get('User-Agent') || undefined;
  const session = await validateSession(env, cookieHeader, userAgent);

  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unauthorized',
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // TODO: 実装
  // const body = await request.json();
  // await saveContent(env, body.type, body.content);

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Not implemented - configure r2.ts CONTENT_KEY first',
    } satisfies ApiResponse),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
