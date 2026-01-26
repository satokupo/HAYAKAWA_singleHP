/**
 * サイト設定（マスター）
 *
 * サイト全体に関係する設定値をここでグローバルに管理する。
 * 店舗名、URL、上限値など、プロジェクト固有の値はすべてこのファイルで一元管理。
 * 他のファイルからはこの設定をimportして参照する。
 *
 * 注意: siteUrl は環境変数 SITE_URL で上書き可能（ローカル/本番の切り替え用）
 */

export const siteConfig = {
  /** ヘッダーの「〇〇様」表示用 */
  storeName: 'HAYAKAWA',

  /** フッター「サイトを見る」リンク先（デフォルト値、環境変数で上書き可能） */
  siteUrl: 'https://hayakawa-gyoza.com',

  /** フッター「お問い合わせ」リンク先（空文字の場合は # になる） */
  contactUrl: '',

  /** 各タイプの画像保存上限（超えた分は古いものから自動削除） */
  maxImagesPerType: 10,
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * 環境変数を含めた設定を取得
 * Astroコンポーネントから呼び出す
 */
export function getSiteConfig(env?: { SITE_URL?: string }): SiteConfig {
  return {
    ...siteConfig,
    siteUrl: env?.SITE_URL || siteConfig.siteUrl,
  };
}
