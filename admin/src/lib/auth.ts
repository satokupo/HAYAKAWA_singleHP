/**
 * 認証ロジック
 */

import type { Env, AuthRequest, AuthResponse } from './types';
import { createSession } from './session';
import { checkRateLimit, getClientIp } from './rate-limit';

/**
 * 認証を実行
 */
export async function authenticate(
  env: Env,
  request: Request,
  credentials: AuthRequest
): Promise<AuthResponse & { cookie?: string }> {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('User-Agent') || undefined;

  // レート制限チェック
  const rateLimit = await checkRateLimit(env, ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: 'アクセスが制限されています。しばらく経ってからお試しください。',
      retryAfter: rateLimit.retryAfter,
    };
  }

  // 認証情報の検証
  const validId = env.ADMIN_ID;
  const validPassword = env.ADMIN_PASSWORD;

  // タイミング攻撃対策: 定数時間比較
  const idMatch = timingSafeEqual(credentials.id, validId);
  const passwordMatch = timingSafeEqual(credentials.password, validPassword);

  if (!idMatch || !passwordMatch) {
    return {
      success: false,
      message: 'IDまたはパスワードが正しくありません。',
    };
  }

  // セッション作成
  const { cookie } = await createSession(env, userAgent);

  return {
    success: true,
    cookie,
  };
}

/**
 * タイミング攻撃対策の文字列比較
 * 両方の文字列を同じ長さに揃えて比較することで、
 * 文字列の長さや一致位置による処理時間の差を軽減
 */
function timingSafeEqual(a: string, b: string): boolean {
  // TextEncoder を使ってバイト配列に変換
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // 長さが異なる場合もダミー比較を行う
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let result = aBytes.length === bBytes.length ? 1 : 0;

  for (let i = 0; i < maxLen; i++) {
    const aByte = aBytes[i] ?? 0;
    const bByte = bBytes[i] ?? 0;
    result &= aByte === bByte ? 1 : 0;
  }

  return result === 1;
}
