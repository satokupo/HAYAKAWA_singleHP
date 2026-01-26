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

3. **ローカル環境変数を設定**
   ```bash
   cp .dev.vars.example .dev.vars
   # .dev.vars を編集して ADMIN_PASSWORD を設定
   ```

4. **開発サーバーを起動**

   **chrome-check スキル** を使用すること。
   ```
   「adminを起動して」
   「adminをDevToolsで確認」
   ```

5. **ブラウザで確認**
   - http://localhost:8788 にアクセス
   - ログイン画面が表示されればOK

---

## 2. テンプレートの設計思想

### 認証・セッション管理

- **KV Namespace** でセッション管理
- **タイミング攻撃対策** 付きの認証
- **レート制限** でブルートフォース対策
- **匿名化されたログイン画面**（サイト情報を出さない）

### 最小限のスタート

- テンプレートはログイン機能のみ実装済み
- ダッシュボード・更新画面はプロジェクトに応じて実装
- 参考用サンプル: `src/pages/update/_example.astro.txt`

### Cloudflare完結

- **Pages + Workers** でSSR
- **R2** で画像ストレージ
- **KV** でセッション・レート制限

---

## 3. Cloudflareリソースの準備

### 本番デプロイ前に必要な作業

```bash
# KV Namespace 作成
wrangler kv namespace create SESSIONS
wrangler kv namespace create RATE_LIMIT

# R2 Bucket 作成
wrangler r2 bucket create your-project-images

# シークレット設定
wrangler secret put ADMIN_PASSWORD
```

### wrangler.jsonc の更新

作成したリソースのIDを `wrangler.jsonc` に設定:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "SESSIONS",
      "id": "xxxxx"  // ← 実際のID
    }
  ]
}
```

---

## 4. テンプレート各ファイルの役割

### 設定ファイル

| ファイル | 役割 |
|----------|------|
| `package.json` | 依存パッケージの定義 |
| `astro.config.mjs` | Astro設定（SSR + Cloudflare Adapter） |
| `tailwind.config.mjs` | Tailwind設定 |
| `tsconfig.json` | TypeScript設定（Cloudflare types含む） |
| `wrangler.jsonc` | Cloudflareバインディング設定 |
| `.dev.vars.example` | ローカル環境変数のサンプル |

### src/lib/ - ライブラリ

| ファイル | 役割 |
|----------|------|
| `types.ts` | Env型定義、コンテンツ型定義 |
| `auth.ts` | 認証ロジック（タイミング攻撃対策） |
| `session.ts` | セッション管理（KV） |
| `rate-limit.ts` | レート制限（ブルートフォース対策） |
| `r2.ts` | R2操作（画像アップロード・コンテンツ管理） |
| `image.ts` | 画像処理（クライアントサイド用コード含む） |

### src/layouts/

| ファイル | 役割 |
|----------|------|
| `AuthLayout.astro` | 認証チェック付きレイアウト |

### src/pages/

| ファイル | 役割 |
|----------|------|
| `index.astro` | ログイン画面（匿名化） |
| `dashboard/index.astro` | ダッシュボード（プレースホルダー） |
| `update/_example.astro.txt` | 更新画面サンプル |
| `images/[...path].ts` | R2画像配信 |
| `api/auth.ts` | 認証API |
| `api/upload.ts` | 画像アップロードAPI |
| `api/content.ts` | コンテンツ取得・更新API |
| `api/public/content.ts` | 公開コンテンツAPI（CORS対応） |

---

## 5. カスタマイズが必要な部分

### 必須: コンテンツ定義

1. **`src/lib/types.ts`** - コンテンツの型定義
   ```typescript
   // 例: カレンダーコンテンツ
   export interface CalendarContent {
     imageUrl: string;
     month: string;
     updatedAt: string;
   }
   ```

2. **`src/lib/r2.ts`** - コンテンツキーの設定
   ```typescript
   const CONTENT_KEY = {
     calendar: 'content/calendar.json',
     limited: 'content/limited.json',
   } as const;
   ```

3. **`src/pages/api/public/content.ts`** - 公開APIの実装

### 必須: 画面実装

1. **`src/pages/dashboard/index.astro`** - ダッシュボード
2. **`src/pages/update/`** - 更新画面

### オプション: カスタマイズ

- **`wrangler.jsonc`** - プロジェクト名、環境変数
- **`src/pages/api/public/content.ts`** - CORS許可ドメイン

---

## 6. ローカル開発

### 開発サーバー

**chrome-check スキル** を使用してサーバーを起動すること。

```
「adminを起動して」
「adminをDevToolsで確認」
```

内部では `npm run preview`（Wrangler）が実行され、
KV・R2がローカルでエミュレートされる。

**注意**: `npm run dev` は使用しない。KV/R2が動作しないため。

---

## 7. デプロイ

### 初回デプロイ

```bash
# Cloudflareリソースを作成（前述）
# wrangler.jsonc を更新

# デプロイ
npm run deploy
```

### 継続的デプロイ

GitHubリポジトリと連携し、push時に自動デプロイ可能。

---

## チェックリスト

### 初期構築時

- [ ] テンプレートをコピーしたか
- [ ] `npm install` を実行したか
- [ ] `.dev.vars` を作成し、ADMIN_PASSWORD を設定したか
- [ ] chrome-checkスキルでサーバーが起動するか
- [ ] ログイン画面が表示されるか

### デプロイ前

- [ ] KV Namespace を作成したか
- [ ] R2 Bucket を作成したか
- [ ] `wrangler.jsonc` にリソースIDを設定したか
- [ ] `wrangler secret put ADMIN_PASSWORD` を実行したか
- [ ] コンテンツ型とAPIを実装したか
