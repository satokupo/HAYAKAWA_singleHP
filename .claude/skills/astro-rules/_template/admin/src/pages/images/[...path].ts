/**
 * R2 画像配信エンドポイント
 *
 * GET /images/{path} - R2から画像を配信
 *
 * 認証不要（公開画像配信用）
 */

import type { APIRoute } from 'astro';
import type { Env } from '../../lib/types';
import { getObject } from '../../lib/r2';

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env as Env;
  const path = params.path;

  if (!path) {
    return new Response('Not found', { status: 404 });
  }

  // R2からオブジェクトを取得
  const fullPath = `images/${path}`;
  const object = await getObject(env, fullPath);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  // Content-Type を取得（デフォルトは image/webp）
  const contentType = object.httpMetadata?.contentType || 'image/webp';

  // キャッシュヘッダーを設定
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });

  return new Response(object.body, { headers });
};
