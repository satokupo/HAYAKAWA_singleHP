/**
 * R2 操作ヘルパー
 * Cloudflare R2 との連携
 *
 * TODO: プロジェクトに応じてコンテンツキーをカスタマイズ
 */

import type { Env } from './types';

// ============================================================
// コンテンツキー設定
// プロジェクトに応じてカスタマイズしてください
// ============================================================

/** コンテンツJSONのキー */
const CONTENT_KEY = {
  // 例: calendar: 'content/calendar.json',
  // 例: limited: 'content/limited.json',
} as const;

type ContentType = keyof typeof CONTENT_KEY;

// ============================================================
// 汎用R2操作関数
// ============================================================

/**
 * 画像をR2にアップロード
 * @param env Cloudflare環境
 * @param type 画像タイプ
 * @param data 画像データ（WebP変換済み）
 * @param filename オリジナルファイル名（参考用）
 * @returns アップロード後のパス
 */
export async function uploadImage(
  env: Env,
  type: string,
  data: ArrayBuffer,
  _filename: string
): Promise<string> {
  // ユニークなファイル名を生成（タイムスタンプベース）
  const timestamp = Date.now();
  const path = `images/${type}/${timestamp}.webp`;

  await env.IMAGES.put(path, data, {
    httpMetadata: {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000', // 1年キャッシュ
    },
  });

  return path;
}

/**
 * コンテンツJSONを取得
 */
export async function getContent<T>(
  env: Env,
  type: ContentType
): Promise<T | null> {
  const key = CONTENT_KEY[type];
  if (!key) {
    console.error(`Unknown content type: ${type}`);
    return null;
  }

  const object = await env.IMAGES.get(key);

  if (!object) {
    return null;
  }

  try {
    const text = await object.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * コンテンツJSONを保存
 */
export async function saveContent<T>(
  env: Env,
  type: ContentType,
  content: T
): Promise<void> {
  const key = CONTENT_KEY[type];
  if (!key) {
    throw new Error(`Unknown content type: ${type}`);
  }

  const data = JSON.stringify(content, null, 2);

  await env.IMAGES.put(key, data, {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

/**
 * 画像を削除
 */
export async function deleteImage(env: Env, path: string): Promise<void> {
  await env.IMAGES.delete(path);
}

/**
 * R2からオブジェクトを取得（画像配信用）
 */
export async function getObject(
  env: Env,
  path: string
): Promise<R2ObjectBody | null> {
  return await env.IMAGES.get(path);
}

/**
 * R2のパブリックURLを生成
 * 注意: R2バケットのカスタムドメイン設定が必要
 */
export function getPublicUrl(path: string, customDomain?: string): string {
  if (customDomain) {
    return `https://${customDomain}/${path}`;
  }
  // カスタムドメインが未設定の場合はパスのみ返す
  return `/${path}`;
}
