# Admin 初期構築ルール

管理画面（admin/）の初期構築手順。

---

## 1. 構築手順

### 基本フロー

1. **テンプレートをコピー**
   ```bash
   cp -r .claude/skills/astro-rules/_template/admin/ ./admin/
   ```

2. **依存パッケージをインストール**
   ```bash
   cd admin && npm install
   ```

3. **環境変数を設定**
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   `.dev.vars` を編集して `ADMIN_PASSWORD` を設定:
   ```
   ADMIN_PASSWORD=開発用パスワード
   SITE_URL=http://localhost:8788
   ```

4. **開発サーバーを起動**

   **chrome-check スキル** を使用すること。
   ```
   「adminを起動して」
   「adminをDevToolsで確認」
   ```

5. **ブラウザで確認**
   - http://localhost:8789 にアクセス
   - ログイン画面が表示されればOK

---

## 2. KV/R2の必要性

adminはセッション管理と画像保存のため、Cloudflareのリソースが必要。

| リソース | 用途 | バインディング名 |
|----------|------|-----------------|
| **KV: SESSIONS** | ログインセッション管理 | `SESSIONS` |
| **KV: RATE_LIMIT** | レートリミット用 | `RATE_LIMIT` |
| **R2: IMAGES** | アップロード画像の保存 | `IMAGES` |

### ローカル開発時

Wranglerが自動でローカルエミュレートを提供するため、特別な設定は不要。

### 本番デプロイ前

[cloudflare-resources.md](./cloudflare-resources.md) の手順でリソースを作成し、IDを設定する。

---

## 3. wrangler.jsonc の設定

adminの設定ファイル。本番デプロイ前に以下を更新する必要がある。

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-project-admin",  // ← プロジェクト名に変更
  "compatibility_date": "2025-01-01",
  "compatibility_flags": ["nodejs_compat"],

  // 開発サーバーポート（固定）
  "dev": {
    "port": 8789
  },

  // KV Namespaces（本番デプロイ前にID設定必須）
  "kv_namespaces": [
    {
      "binding": "SESSIONS",
      "id": "<SESSIONS_KV_ID>"  // ← 作成後のIDに置換
    },
    {
      "binding": "RATE_LIMIT",
      "id": "<RATE_LIMIT_KV_ID>"  // ← 作成後のIDに置換
    }
  ],

  // R2 Buckets（本番デプロイ前にバケット名設定必須）
  "r2_buckets": [
    {
      "binding": "IMAGES",
      "bucket_name": "your-project-images"  // ← バケット名に変更
    }
  ],

  // 環境変数（本番にデプロイされる）
  "vars": {
    "ADMIN_ID": "admin",
    "SESSION_TTL": "3600",
    "SITE_URL": "https://example.com"  // ← 本番URL
  }
}
```

### 設定項目の説明

| 項目 | 説明 |
|------|------|
| `name` | Cloudflare上でのWorker名 |
| `dev.port` | ローカル開発サーバーのポート（8789固定） |
| `kv_namespaces` | KVのバインディング設定 |
| `r2_buckets` | R2バケットのバインディング設定 |
| `vars` | 環境変数（本番にもデプロイされる） |

---

## 4. .dev.vars の設定

ローカル開発専用の環境変数。**Gitにコミットしない**。

```bash
# admin/.dev.vars

# 認証用パスワード（本番では wrangler secret put で設定）
ADMIN_PASSWORD=your_secure_password_here

# フッター「サイトを見る」リンク先（ローカルのfront）
SITE_URL=http://localhost:8788
```

### 環境変数の使い分け

| 設定場所 | 用途 | 本番に含まれる |
|----------|------|---------------|
| `wrangler.jsonc` の `vars` | 本番用の環境変数 | Yes |
| `.dev.vars` | ローカル開発用の環境変数 | No |

**重要**: `ADMIN_PASSWORD` はSecretsとして設定するため、`wrangler.jsonc` には書かない。

---

## 5. テンプレート各ファイルの役割

### 設定ファイル

| ファイル | 役割 |
|----------|------|
| `package.json` | 依存パッケージの定義 |
| `astro.config.mjs` | Astro設定（Cloudflareアダプター） |
| `wrangler.jsonc` | Cloudflare Workers設定 |
| `.dev.vars.example` | ローカル環境変数のテンプレート |

### src/ ディレクトリ

| ディレクトリ/ファイル | 役割 |
|----------------------|------|
| `pages/index.astro` | ログインページ/管理画面 |
| `pages/api/auth.ts` | 認証API |
| `pages/images/[...path].ts` | 画像配信API（R2から） |
| `lib/auth.ts` | 認証ロジック |
| `lib/session.ts` | セッション管理（KV使用） |
| `lib/rate-limit.ts` | レートリミット（KV使用） |

---

## 6. 本番デプロイ前の準備

本番デプロイ前に以下の設定が必要:

1. **Cloudflareリソースの作成**
   - KV名前空間 x2（SESSIONS, RATE_LIMIT）
   - R2バケット x1（IMAGES）
   - 詳細: [cloudflare-resources.md](./cloudflare-resources.md)

2. **wrangler.jsoncの更新**
   - 作成したKV IDを設定
   - R2バケット名を設定
   - 本番用の `vars` を設定

3. **Secretsの設定**
   ```bash
   wrangler secret put ADMIN_PASSWORD
   ```

4. **カスタムドメイン設定（オプション）**
   - `workers_dev: false` を追加
   - `routes` でカスタムドメインを設定
   - 詳細: [../deploy/custom-domain.md](../deploy/custom-domain.md)

---

## チェックリスト

### 初期構築時

- [ ] テンプレートをコピーしたか
- [ ] `npm install` を実行したか
- [ ] `.dev.vars` を作成し、パスワードを設定したか
- [ ] chrome-checkスキルでサーバーが起動するか
- [ ] ブラウザでログイン画面が表示されるか

### 本番デプロイ前

- [ ] KV名前空間を作成したか（SESSIONS, RATE_LIMIT）
- [ ] R2バケットを作成したか（IMAGES）
- [ ] `wrangler.jsonc` にKV IDを設定したか
- [ ] `wrangler secret put ADMIN_PASSWORD` を実行したか
- [ ] GitHub Secretsを設定したか
