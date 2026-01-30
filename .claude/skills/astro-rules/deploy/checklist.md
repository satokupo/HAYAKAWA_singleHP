# デプロイ前後チェックリスト

## デプロイ前チェック

### 必須確認項目

- [ ] **`.assetsignore` が存在する**
  - `public/.assetsignore` に `_worker.js` が記載されている
  - Astroビルド時の `_worker.js` ディレクトリ除外用

- [ ] **Tailwind CDN を使っていない**
  - npm版 `@astrojs/tailwind` を使用
  - CDNはCloudflareで動作しないことがある

- [ ] **hidden input に required がない**
  - `type="hidden"` の要素に `required` 属性を付けない
  - バリデーションはJS側で実装

- [ ] **環境設定に全環境のマッピングがある**
  - front: `ADMIN_API_URL_MAP` にローカル/本番URLを設定
  - 環境ごとのAPI URLが正しく設定されている

- [ ] **admin CORS に全環境のオリジンがある**
  - `allowedOrigins` にローカル/本番の全URLを追加
  - frontのデフォルトドメイン、カスタムドメイン両方

- [ ] **ADMIN_PASSWORD が Secret として設定済み**
  - `wrangler secret put ADMIN_PASSWORD` で設定
  - varsではなくSecretとして設定（平文でコミットしない）

- [ ] **Workers プロジェクトが作成済み**
  - 初回デプロイで自動作成される場合もある
  - エラーが出た場合は手動で確認

- [ ] **静的ファイルは `/images/` 配下に配置**
  - ルートレベルに静的ファイルを置かない
  - `/images/` 配下に配置する

---

## wrangler.jsonc 確認

### 構築段階

```jsonc
{
  "workers_dev": true,  // テスト用にデフォルトドメイン有効
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}
```

### 本番公開後

```jsonc
{
  "workers_dev": false,  // デフォルトドメイン無効化
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}
```

---

## GitHub Actions 確認

- [ ] **wranglerVersion: "4" が指定されている**
  - Workers Static Assets には wrangler 4.x が必要

- [ ] **--commit-message が明示指定されている**
  - 日本語コミットメッセージ対策
  - `--commit-message="Deploy from GitHub Actions"`

---

## デプロイ後チェック

### アクセス確認

- [ ] **カスタムドメインでアクセスできる**

```bash
curl -sI https://example.com | head -10
# HTTP/2 200 が返ればOK
```

- [ ] **workers_dev: false でデフォルトドメインが無効化されている**

```bash
curl -sI https://project-name.xxx.workers.dev | head -5
# HTTP/2 404 または接続拒否が返ればOK
# ※ 301リダイレクトはBulk Redirectsが有効な場合
```

- [ ] **HTTPS証明書が有効**

```bash
curl -sI https://example.com | grep -i "server:"
# server: cloudflare が返ればOK
```

### SEO確認

- [ ] **robots メタタグが正しい**

```bash
curl -s https://example.com | grep robots
# <meta name="robots" content="index, follow"> が返ればOK
# または noindex が意図通りか確認
```

### 機能確認

- [ ] **ログインできる**（admin）
- [ ] **画像アップロードできる**（R2連携）
- [ ] **セッションが維持される**（KV連携）
- [ ] **front から admin API が呼び出せる**（CORS）

---

## DNS移行時の追加チェック

既存サイト（WordPress等）からの移行時。

### 移行前

- [ ] **既存サイトのバックアップを取得**
- [ ] **MX/TXTレコードを確認・記録**（メール機能保持用）

### 移行作業

- [ ] **既存CNAME/Aレコードを削除**
- [ ] **MX/TXTレコードは維持**
- [ ] **デプロイ実行**
- [ ] **wranglerがDNSレコードを自動作成**

### 移行後

- [ ] **カスタムドメインでアクセス可能**
- [ ] **メール機能が動作する**（MXレコード確認）
- [ ] **SPF/DKIMが有効**（メール認証確認）

---

## クイックコマンド集

### デプロイ確認

```bash
# カスタムドメインでのアクセス確認
curl -sI https://example.com | head -10

# SSL確認
curl -sI https://example.com | grep -i "server:"

# robots確認
curl -s https://example.com | grep robots
```

### GitHub Actions 確認

```bash
# 最近のデプロイ一覧
gh run list --workflow=deploy-front.yml --limit=5

# 最新runの詳細
gh run view --workflow=deploy-front.yml

# ログ取得
gh run view --workflow=deploy-front.yml --log
```

### wrangler 確認

```bash
# Workers一覧
npx wrangler workers list

# プロジェクト詳細
npx wrangler whoami
```

---

## 関連ドキュメント

- [デプロイ全体像](./index.md)
- [カスタムドメイン設定](./custom-domain.md)
- [GitHub Actions](./github-actions.md)
- [トラブルシューティング](./troubleshooting.md)
