/**
 * 画像アップロード API
 *
 * POST /api/upload - 画像をアップロード
 */

import type { APIRoute } from 'astro';
import type { Env, ApiResponse, ImageUploadResponse, SampleImageContent, SampleImageTextContent, OgpContent } from '../../lib/types';
import { validateSession } from '../../lib/session';
import { uploadImage, getContent, saveContent, getPublicUrl } from '../../lib/r2';
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
        error: '認証が必要です。',
      } satisfies ApiResponse),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // multipart/form-data を解析
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const type = formData.get('type') as 'sample-image' | 'sample-image-text' | 'ogp' | null;
    const isPngStr = formData.get('isPng') as string | null; // PNG維持フラグ
    const isPng = isPngStr === 'true';

    // バリデーション
    if (!file || !type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '画像とタイプを指定してください。',
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (type !== 'sample-image' && type !== 'sample-image-text' && type !== 'ogp') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'タイプは sample-image, sample-image-text, ogp のいずれかを指定してください。',
        } satisfies ApiResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ファイル検証
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
    const imageData = await file.arrayBuffer();
    const imagePath = await uploadImage(env, type, imageData, isPng);
    const imageUrl = getPublicUrl(imagePath);

    // コンテンツJSONを更新
    const now = new Date().toISOString();

    if (type === 'sample-image') {
      const content: SampleImageContent = {
        imageUrl,
        updatedAt: now,
      };
      await saveContent(env, 'sample-image', content);
    } else if (type === 'ogp') {
      // 既存のコンテンツを取得してマージ
      const existing = await getContent<OgpContent>(env, 'ogp');
      const content: OgpContent = {
        title: existing?.title || '',
        description: existing?.description || '',
        imageUrl,
        updatedAt: now,
      };
      await saveContent(env, 'ogp', content);
    } else {
      // sample-image-text: 既存のコンテンツを取得してマージ
      const existing = await getContent<SampleImageTextContent>(env, 'sample-image-text');
      const content: SampleImageTextContent = {
        title: existing?.title || '',
        description: existing?.description || '',
        imageUrl,
        updatedAt: now,
      };
      await saveContent(env, 'sample-image-text', content);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: imageUrl,
      } satisfies ImageUploadResponse),
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
        error: 'アップロード処理中にエラーが発生しました。',
      } satisfies ApiResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
