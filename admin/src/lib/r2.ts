/**
 * R2 操作ヘルパー
 * Cloudflare R2 との連携
 */

import type { Env, CalendarContent, LimitedMenuContent } from './types';

/** コンテンツJSONのキー */
const CONTENT_KEY = {
  calendar: 'content/calendar.json',
  limited: 'content/limited.json',
} as const;

/**
 * 画像をR2にアップロード
 * @param env Cloudflare環境
 * @param type 画像タイプ（calendar | limited）
 * @param data 画像データ（WebP変換済み）
 * @param filename オリジナルファイル名（拡張子用）
 * @returns アップロード後のパス
 */
export async function uploadImage(
  env: Env,
  type: 'calendar' | 'limited',
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
export async function getContent<T extends CalendarContent | LimitedMenuContent>(
  env: Env,
  type: 'calendar' | 'limited'
): Promise<T | null> {
  const key = CONTENT_KEY[type];
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
export async function saveContent<T extends CalendarContent | LimitedMenuContent>(
  env: Env,
  type: 'calendar' | 'limited',
  content: T
): Promise<void> {
  const key = CONTENT_KEY[type];
  const data = JSON.stringify(content, null, 2);

  await env.IMAGES.put(key, data, {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

/**
 * 古い画像を削除（任意）
 */
export async function deleteImage(env: Env, path: string): Promise<void> {
  await env.IMAGES.delete(path);
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
