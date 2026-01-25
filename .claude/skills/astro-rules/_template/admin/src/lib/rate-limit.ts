/**
 * レート制限
 * 機械的攻撃（ブルートフォース）対策
 *
 * 仕様:
 * - 1秒間に10回以上のログイン試行を検出したら、そのIPを1時間ブロック
 */

import type { Env, RateLimitData } from './types';

/** 1秒間の最大試行回数 */
const MAX_ATTEMPTS_PER_SECOND = 10;

/** ブロック時間（秒） */
const BLOCK_DURATION = 3600; // 1時間

/** 試行記録の保持時間（秒） */
const ATTEMPT_WINDOW = 2; // 直近2秒分を保持

/**
 * レート制限をチェック
 * @param env Cloudflare環境
 * @param ip クライアントIP
 * @returns { allowed: true } または { allowed: false, retryAfter: number }
 */
export async function checkRateLimit(
  env: Env,
  ip: string
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const key = `rate:${ip}`;
  const now = Math.floor(Date.now() / 1000);

  // 既存のデータを取得
  const data = await env.RATE_LIMIT.get(key);
  let rateLimitData: RateLimitData;

  if (data) {
    try {
      rateLimitData = JSON.parse(data);
    } catch {
      rateLimitData = { attempts: [] };
    }
  } else {
    rateLimitData = { attempts: [] };
  }

  // ブロック中かチェック
  if (rateLimitData.blocked && rateLimitData.blockedUntil) {
    if (now < rateLimitData.blockedUntil) {
      return { allowed: false, retryAfter: rateLimitData.blockedUntil };
    }
    // ブロック期間が過ぎたらリセット
    rateLimitData = { attempts: [] };
  }

  // 古い試行記録を削除（直近ATTEMPT_WINDOW秒以内のみ保持）
  rateLimitData.attempts = rateLimitData.attempts.filter(
    (t) => now - t < ATTEMPT_WINDOW
  );

  // 直近1秒間の試行回数をカウント
  const recentAttempts = rateLimitData.attempts.filter((t) => now - t < 1);

  // 1秒間に10回以上の試行があれば1時間ブロック
  if (recentAttempts.length >= MAX_ATTEMPTS_PER_SECOND) {
    rateLimitData.blocked = true;
    rateLimitData.blockedUntil = now + BLOCK_DURATION;
    rateLimitData.attempts = []; // 試行記録をクリア

    await env.RATE_LIMIT.put(key, JSON.stringify(rateLimitData), {
      expirationTtl: BLOCK_DURATION,
    });

    return { allowed: false, retryAfter: rateLimitData.blockedUntil };
  }

  // 試行を記録
  rateLimitData.attempts.push(now);

  await env.RATE_LIMIT.put(key, JSON.stringify(rateLimitData), {
    expirationTtl: BLOCK_DURATION,
  });

  return { allowed: true };
}

/**
 * 指定IPのレート制限をリセット（デバッグ用）
 */
export async function resetRateLimit(env: Env, ip: string): Promise<void> {
  const key = `rate:${ip}`;
  await env.RATE_LIMIT.delete(key);
}

/**
 * クライアントIPを取得
 */
export function getClientIp(request: Request): string {
  // Cloudflare が設定するヘッダー
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // フォールバック: X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // ローカル開発時はダミーIP
  return '127.0.0.1';
}
