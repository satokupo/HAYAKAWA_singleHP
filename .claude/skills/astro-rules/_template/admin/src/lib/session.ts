/**
 * セッション管理
 * KV Namespace を使用したセッション管理
 */

import type { Env, SessionData } from './types';

/** セッションCookie名 */
const SESSION_COOKIE_NAME = 'sid';

/** セッションIDの長さ */
const SESSION_ID_LENGTH = 32;

/**
 * 暗号学的に安全なセッションIDを生成
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(SESSION_ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * セッションを作成
 */
export async function createSession(
  env: Env,
  userAgent?: string
): Promise<{ sessionId: string; cookie: string }> {
  const sessionId = generateSessionId();
  const ttl = parseInt(env.SESSION_TTL, 10) || 3600;
  const now = Math.floor(Date.now() / 1000);

  const sessionData: SessionData = {
    id: sessionId,
    createdAt: now,
    expiresAt: now + ttl,
    userAgent,
  };

  // KVに保存（TTL付き）
  await env.SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    expirationTtl: ttl,
  });

  // Cookie文字列を生成
  const cookie = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${ttl}`,
  ].join('; ');

  return { sessionId, cookie };
}

/**
 * セッションを検証
 * @returns 有効なセッションデータ、または null
 */
export async function validateSession(
  env: Env,
  cookieHeader: string | null,
  userAgent?: string
): Promise<SessionData | null> {
  if (!cookieHeader) {
    return null;
  }

  // Cookie からセッションIDを抽出
  const sessionId = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!sessionId) {
    return null;
  }

  // KVからセッションデータを取得
  const data = await env.SESSIONS.get(sessionId);
  if (!data) {
    return null;
  }

  try {
    const session: SessionData = JSON.parse(data);

    // 有効期限チェック
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt < now) {
      // 期限切れのセッションを削除
      await env.SESSIONS.delete(sessionId);
      return null;
    }

    // User-Agent チェック（オプション、追加セキュリティ）
    if (session.userAgent && userAgent && session.userAgent !== userAgent) {
      // User-Agent が変わった場合は不正アクセスの可能性
      await env.SESSIONS.delete(sessionId);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * セッションを削除（ログアウト）
 */
export async function deleteSession(
  env: Env,
  cookieHeader: string | null
): Promise<string> {
  if (cookieHeader) {
    const sessionId = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
    if (sessionId) {
      await env.SESSIONS.delete(sessionId);
    }
  }

  // Cookie削除用の Set-Cookie ヘッダー
  return [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Max-Age=0',
  ].join('; ');
}

/**
 * Cookie ヘッダーから特定のCookieを取得
 */
function parseCookie(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return value || null;
    }
  }
  return null;
}
