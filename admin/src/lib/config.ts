/**
 * サイト設定（マスター）
 *
 * サイト全体に関係する設定値をここでグローバルに管理する。
 * 店舗名、URL、上限値など、プロジェクト固有の値はすべてこのファイルで一元管理。
 * 他のファイルからはこの設定をimportして参照する。
 */

export const siteConfig = {
  /** ヘッダーの「〇〇様」表示用 */
  storeName: 'HAYAKAWA',

  /** フッター「サイトを見る」リンク先 */
  siteUrl: 'https://hayakawa-gyoza.com',

  /** フッター「お問い合わせ」リンク先（空文字の場合は # になる） */
  contactUrl: '',

  /** 各タイプの画像保存上限（超えた分は古いものから自動削除） */
  maxImagesPerType: 10,
} as const;

export type SiteConfig = typeof siteConfig;
