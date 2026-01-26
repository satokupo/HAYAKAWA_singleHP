/**
 * R2 操作ヘルパー
 * Cloudflare R2 との連携
 */

import type { Env, CalendarContent, LimitedMenuContent, OgpContent } from './types';
import { siteConfig } from './config';

/** コンテンツJSONのキー */
const CONTENT_KEY = {
  calendar: 'content/calendar.json',
  limited: 'content/limited.json',
  ogp: 'content/ogp.json',
} as const;

/**
 * 画像をR2にアップロード
 * @param env Cloudflare環境
 * @param type 画像タイプ（calendar | limited | ogp）
 * @param data 画像データ
 * @param isPng PNGかどうか（PNG→.png、それ以外→.webp）
 * @returns アップロード後のパス
 */
export async function uploadImage(
  env: Env,
  type: 'calendar' | 'limited' | 'ogp',
  data: ArrayBuffer,
  isPng: boolean = false
): Promise<string> {
  // ユニークなファイル名を生成（タイムスタンプベース）
  const timestamp = Date.now();
  const extension = isPng ? 'png' : 'webp';
  const contentType = isPng ? 'image/png' : 'image/webp';
  const path = `images/${type}/${timestamp}.${extension}`;

  await env.IMAGES.put(path, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000', // 1年キャッシュ
    },
  });

  // 古い画像を自動削除（上限を超えた場合）
  await cleanupOldImages(env, type);

  return path;
}

/**
 * 古い画像を削除（各タイプの上限を超えた分）
 */
async function cleanupOldImages(
  env: Env,
  type: 'calendar' | 'limited' | 'ogp'
): Promise<void> {
  const prefix = `images/${type}/`;

  // 該当タイプの画像一覧を取得
  const list = await env.IMAGES.list({ prefix });
  const imageKeys = list.objects
    .map((obj) => obj.key)
    .filter((key) => key.match(/\.(webp|png)$/))
    .sort(); // タイムスタンプ順（古い順）

  // 上限を超えた分を削除
  const deleteCount = imageKeys.length - siteConfig.maxImagesPerType;
  if (deleteCount > 0) {
    const keysToDelete = imageKeys.slice(0, deleteCount);
    for (const key of keysToDelete) {
      await env.IMAGES.delete(key);
    }
  }
}

/**
 * コンテンツJSONを取得
 */
export async function getContent<T extends CalendarContent | LimitedMenuContent | OgpContent>(
  env: Env,
  type: 'calendar' | 'limited' | 'ogp'
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
export async function saveContent<T extends CalendarContent | LimitedMenuContent | OgpContent>(
  env: Env,
  type: 'calendar' | 'limited' | 'ogp',
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
