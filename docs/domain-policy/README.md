# ドメイン運用方針

対象ドメイン: `hayakawa-gyoza.com`

---

## 現状の構成（2025-01-29時点）

ネームサーバーはCloudflareで管理。DNSレコードで各サービスに振り分け。

| 用途 | サブドメイン | 向き先 | 備考 |
|------|-------------|--------|------|
| Webサイト（WordPress） | `@`（ルート） | `sv16521.xserver.jp` | Xサーバー |
| Webサイト（WordPress） | `www` | `hayakawa-gyoza.com` | ルートへのエイリアス |
| 管理画面（Workers） | `settei` | `hayakawa-admin` | Cloudflare Workers |
| メール | - | Xサーバー | MX/TXT レコード |

### DNS設定スクリーンショット

移行前のDNSレコード一覧:
![DNS設定（移行前）](./dns-records-2025-01-29-before-migration.png)

---

## 移行後の構成（予定）

| 用途 | サブドメイン | 向き先 | 変更点 |
|------|-------------|--------|--------|
| Webサイト | `@`（ルート） | Cloudflare Pages | **変更** |
| Webサイト | `www` | Cloudflare Pages | **変更** |
| 管理画面 | `settei` | Cloudflare Workers | 変更なし |
| メール | - | Xサーバー | **変更なし** |

---

## 重要事項

### メールはXサーバーで継続利用

- MXレコード、TXTレコード（SPF/DKIM）はそのまま維持
- Xサーバーの契約は継続（メール機能のため）
- Webサイトのみ Cloudflare Pages に移行

### 移行時の変更対象

変更するレコード:
- `CNAME` `@` → Cloudflare Pages の URL に変更
- `CNAME` `www` → Cloudflare Pages の URL に変更

変更しないレコード:
- `MX` レコード（メール用）
- `TXT` レコード（SPF/DKIM）
- `NS` レコード
- `Worker` レコード（settei サブドメイン）

---

## 移行手順（予定）

1. WordPressサイトのバックアップ
2. Cloudflare Pages プロジェクトにカスタムドメインを追加
3. DNSレコード変更（CNAME → Pages）
4. SSL証明書の自動発行を待つ
5. 動作確認
6. WordPressサイトの停止（必要に応じて）

---

## 備考

- ネームサーバー: Cloudflare
- Xサーバー契約: 継続（メール + 他サイト用）
- 移行対象: `hayakawa-gyoza.com` のWebサイト部分のみ
