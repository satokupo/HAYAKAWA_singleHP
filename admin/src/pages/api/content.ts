/**
 * コンテンツ更新 API
 *
 * GET /api/content?type=calendar|limited - コンテンツ取得
 * PUT /api/content - コンテンツ更新（テキストのみ）
 */

import type { APIRoute } from 'astro';
import type { Env, ApiResponse, CalendarContent, LimitedMenuContent } from '../../lib/types';
import { validateSession } from '../../lib/session';
import { getContent, saveContent } from '../../lib/r2';

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
        error: '認証が必要です。',
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') as 'calendar' | 'limited' | null;

  if (!type || (type !== 'calendar' && type !== 'limited')) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'タイプは calendar または limited を指定してください。',
      } satisfies ApiResponse),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const content = await getContent(env, type);

  return new Response(
    JSON.stringify({
      success: true,
      data: content,
    } satisfies ApiResponse),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

/**
 * コンテンツ更新（テキストのみ）
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;

  // 認証チェック
  const cookieHeader = request.headers.get('Cookie');
  const userAgent = request.headers.get('User-Agent') || undefined;
  const session = await validateSession(env, cookieHeader, userAgent);

  if (!session) {
    return new Response(
      JSON.stringify({
        success: false,
        error: '認証が必要です。',
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = await request.json();
    const { type, title, description } = body as {
      type: 'limited';
      title: string;
      description: string;
    };

    // 現在は limited のみテキスト更新をサポート
    if (type !== 'limited') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'テキスト更新は限定メニューのみサポートしています。',
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 既存のコンテンツを取得
    const existing = await getContent<LimitedMenuContent>(env, 'limited');

    const content: LimitedMenuContent = {
      title: title || existing?.title || '',
      description: description || existing?.description || '',
      imageUrl: existing?.imageUrl || '',
      updatedAt: new Date().toISOString(),
    };

    await saveContent(env, 'limited', content);

    return new Response(
      JSON.stringify({
        success: true,
        data: content,
      } satisfies ApiResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Content update error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'コンテンツ更新中にエラーが発生しました。',
      } satisfies ApiResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
