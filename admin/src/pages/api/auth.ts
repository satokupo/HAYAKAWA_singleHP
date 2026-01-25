/**
 * 認証 API エンドポイント
 *
 * POST /api/auth - ログイン
 * DELETE /api/auth - ログアウト
 */

import type { APIRoute } from 'astro';
import type { Env, AuthRequest, ApiResponse } from '../../lib/types';
import { authenticate } from '../../lib/auth';
import { deleteSession } from '../../lib/session';

/**
 * ログイン
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;

  try {
    // リクエストボディをパース
    const body: AuthRequest = await request.json();

    // バリデーション
    if (!body.id || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'IDとパスワードを入力してください。',
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 認証実行
    const result = await authenticate(env, request, body);

    if (result.success && result.cookie) {
      return new Response(
        JSON.stringify({
          success: true,
        } satisfies ApiResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': result.cookie,
          },
        }
      );
    }

    // 認証失敗
    const status = result.retryAfter ? 429 : 401;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (result.retryAfter) {
      const retryAfterSeconds = result.retryAfter - Math.floor(Date.now() / 1000);
      headers['Retry-After'] = String(Math.max(0, retryAfterSeconds));
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: result.message,
      } satisfies ApiResponse),
      { status, headers }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: '認証処理中にエラーが発生しました。',
      } satisfies ApiResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * ログアウト
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env as Env;
  const cookieHeader = request.headers.get('Cookie');

  const clearCookie = await deleteSession(env, cookieHeader);

  return new Response(
    JSON.stringify({
      success: true,
    } satisfies ApiResponse),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie,
      },
    }
  );
};
