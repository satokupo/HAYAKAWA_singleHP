/**
 * 環境別API URLマッピング
 *
 * frontのオリジン（ドメイン）に応じて、adminのAPI URLを決定する。
 * これにより、ローカル/ステージング/本番を1つの設定ファイルで管理できる。
 */

/**
 * オリジン → admin API URL のマッピング
 */
export const ADMIN_API_URL_MAP: Record<string, string> = {
  // ローカル開発
  'localhost:4321': 'http://localhost:8789',
  'localhost:8788': 'http://localhost:8789',

  // ステージング（Cloudflare デフォルトドメイン）
  'hayakawa-front.pages.dev': 'https://hayakawa-admin.hisanori-sakurai.workers.dev',

  // 本番（カスタムドメイン）
  'hayakawa-gyoza.com': 'https://settei.hayakawa-gyoza.com',
  'www.hayakawa-gyoza.com': 'https://settei.hayakawa-gyoza.com',
};

/**
 * 現在のオリジンに対応するadmin API URLを取得
 */
export function getAdminApiUrl(): string {
  // SSR/ビルド時はデフォルト値を返す
  if (typeof window === 'undefined') {
    return 'http://localhost:8789';
  }

  const host = window.location.host;
  const url = ADMIN_API_URL_MAP[host];

  if (url) {
    return url;
  }

  // マッピングにない場合はコンソールに警告を出し、本番URLをフォールバック
  console.warn(`Unknown host: ${host}, falling back to production URL`);
  return ADMIN_API_URL_MAP['hayakawa-gyoza.com'];
}
