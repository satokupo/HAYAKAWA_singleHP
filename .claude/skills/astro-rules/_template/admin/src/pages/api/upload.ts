/**
 * 画像アップロード API
 *
 * POST /api/upload - 画像をR2にアップロード
 *
 * TODO: プロジェクトに応じて type パラメータを調整
 */

import type { APIRoute } from 'astro';
import type { Env, ApiResponse } from '../../lib/types';
import { validateSession } from '../../lib/session';
import { uploadImage } from '../../lib/r2';
import { validateImageFile } from '../../lib/image';

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

  try {
    // FormDataとして受け取る
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File and type are required',
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 画像検証
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // R2にアップロード
    const data = await file.arrayBuffer();
    const path = await uploadImage(env, type, data, file.name);

    return new Response(
      JSON.stringify({
        success: true,
        data: { path },
      } satisfies ApiResponse),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Upload failed',
      } satisfies ApiResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
