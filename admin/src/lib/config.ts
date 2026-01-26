/**
 * サイト設定（マスター）
 * 管理画面全体で使用する設定値
 */

export const siteConfig = {
  /** ヘッダーの「〇〇様」表示用 */
  storeName: 'HAYAKAWA',

  /** フッター「サイトを見る」リンク先 */
  siteUrl: 'https://hayakawa-gyoza.com',

  /** フッター「管理者へ問い合わせ」リンク先（空文字で非表示） */
  contactUrl: '',
} as const;

export type SiteConfig = typeof siteConfig;
