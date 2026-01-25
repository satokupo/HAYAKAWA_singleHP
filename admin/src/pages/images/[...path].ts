/**
 * R2画像配信API
 *
 * GET /images/{path} - R2から画像を取得して配信
 */

import type { APIRoute } from 'astro';
import type { Env } from '../../lib/types';

export const GET: APIRoute = async ({ params, locals }) => {
  const env = locals.runtime.env as Env;
  const path = params.path;

  if (!path) {
    return new Response('Not Found', { status: 404 });
  }

  // R2から画像を取得
  const fullPath = `images/${path}`;
  const object = await env.IMAGES.get(fullPath);

  if (!object) {
    return new Response('Image not found', { status: 404 });
  }

  // コンテンツタイプを決定
  const contentType = object.httpMetadata?.contentType || 'image/webp';

  return new Response(object.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
};
