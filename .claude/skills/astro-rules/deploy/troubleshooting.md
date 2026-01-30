# トラブルシューティング

デプロイ時によく発生するエラーと対策。

---

## 1. _worker.js アセットアップロードエラー

### 症状

```
ERROR Uploading a Pages _worker.js directory as an asset
```

Astroがビルド時に `dist/_worker.js/` ディレクトリを生成するが、Cloudflareがこれをアセットとしてアップロードしようとしてエラーになる。

### 対策

`public/.assetsignore` ファイルを作成し、`_worker.js` を除外。

```
# public/.assetsignore
_worker.js
```

---

## 2. Tailwind CSS CDN が本番で動作しない

### 症状

- ローカルでは正常動作
- 本番環境でCORSエラー、スタイルが適用されない
- CDNからのリソース読み込みがブロックされる

### 原因

Cloudflare Workers/Pagesでは、CDN経由のTailwindが動作しない場合がある。

### 対策

npmでインストールし、`@astrojs/tailwind` を使用。

```bash
npm install tailwindcss @astrojs/tailwind
```

```javascript
// astro.config.mjs
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

**CDNは禁止**。必ずnpm版を使用する。

---

## 3. hidden input の required 属性エラー

### 症状

```
An invalid form control with name='xxx' is not focusable
```

フォーム送信時にブラウザエラーが発生。

### 原因

`type="hidden"` の input に `required` 属性が付いている。hidden要素はフォーカスできないため、ブラウザがバリデーションエラーを出す。

### 対策

hidden要素から `required` を削除し、JavaScript側でバリデーションを行う。

```html
<!-- NG -->
<input type="hidden" name="token" required>

<!-- OK -->
<input type="hidden" name="token">
```

---

## 4. front から admin API接続エラー（CORS）

### 症状

- frontからadminのAPIを呼び出すとCORSエラー
- ローカルでは動作するが、本番で動作しない
- API経由のデータが表示されない

### 原因

admin側のCORS許可リストに、frontの全環境URLが含まれていない。

### 対策

#### admin側のCORS設定（全環境を追加）

```typescript
// admin/src/pages/api/public/content.ts
const allowedOrigins = [
  // ローカル開発
  'http://localhost:3000',
  'http://localhost:4321',
  'http://localhost:8788',
  // 本番（Cloudflare デフォルトドメイン）
  'https://hayakawa-front.pages.dev',
  // 本番（カスタムドメイン）
  'https://hayakawa-gyoza.com',
  'https://www.hayakawa-gyoza.com',
];
```

#### front側の環境別API URLマッピング

```typescript
// front/src/lib/config.ts
export const ADMIN_API_URL_MAP: Record<string, string> = {
  'localhost:4321': 'http://localhost:8789',
  'hayakawa-front.pages.dev': 'https://settei.hayakawa-gyoza.com',
  'hayakawa-gyoza.com': 'https://settei.hayakawa-gyoza.com',
};
```

---

## 5. ADMIN_PASSWORD が設定されていない

### 症状

- 正しいパスワードでもログインできない
- 認証エラーが発生する

### 原因

Cloudflare Workersの Secret にパスワードが設定されていない。

### 対策

wrangler CLIで Secret を設定。

```bash
# adminディレクトリで実行
cd admin
npx wrangler secret put ADMIN_PASSWORD

# プロンプトでパスワードを入力
```

**注意**: wrangler.jsonc の `vars` ではなく、**Secret** として設定する。vars に平文でパスワードを書かないこと。

---

## 6. Workers/Pages プロジェクトが存在しない

### 症状

```
Project not found
```

デプロイ時にプロジェクトが見つからないエラー。

### 対策

#### 初回デプロイの場合

初回デプロイで自動作成されることが多い。まずデプロイを実行してみる。

#### 事前に作成する場合

```bash
# Workersプロジェクト作成（通常は不要）
npx wrangler deploy
```

---

## 7. ルートレベルの静的ファイルがアクセスできない

### 症状

- `/placeholder.webp` にアクセスするとトップページが表示される
- ルート直下に配置した静的ファイルが404ではなくトップにリダイレクトされる

### 原因

Cloudflare Pages/Workersの静的ファイル配信の仕様。ルートレベルの特定パターンは別処理される。

### 対策

静的ファイルは `/images/` 配下に配置。

```
推奨構成:
public/
└── images/
    ├── placeholder.webp
    ├── logo.webp
    └── hero.webp

参照方法:
/images/placeholder.webp
```

---

## 8. 日本語コミットメッセージでデプロイ失敗

### 症状

```
Invalid commit message, it must be a valid UTF-8 string
```

GitHub Actionsからのデプロイで、日本語コミットメッセージがあるとエラー。

### 原因

wranglerがGitのコミットメッセージを取得する際、日本語がUTF-8として正しく処理されない場合がある。

### 対策

GitHub Actionsで `--commit-message` を明示指定。

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    command: deploy --commit-hash=${{ github.sha }} --commit-message="Deploy from GitHub Actions"
```

これにより、Gitの日本語コミットメッセージに依存せず、英語の固定メッセージが使用される。

---

## 9. wrangler バージョンが古い

### 症状

```
Missing entry-point: The entry-point should be specified via the command line
(e.g. `wrangler deploy path/to/script`) or the `main` config field.
```

Workers Static Assets の新形式（`assets.directory`）でデプロイ時にエラー。

### 原因

wrangler-actionがデフォルトでインストールするwranglerバージョンが古い（3.x系）。

### 対策

`wranglerVersion: "4"` を明示指定。

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    wranglerVersion: "4"  # 重要
    command: deploy
```

---

## 10. 既存DNSレコードでカスタムドメイン設定失敗

### 症状

```
Hostname 'example.com' already has externally managed DNS records (A, CNAME, etc).
Either delete them, try a different hostname, or use the option 'override_existing_dns_record' to override.
```

### 原因

`custom_domain: true` は、既存のDNSレコードがあると失敗する。

### 対策

1. Cloudflareダッシュボードで既存CNAME/Aレコードを**先に削除**
2. MX/TXTレコードは**維持**（メール機能保持）
3. デプロイ実行 → wranglerが自動でDNS設定

**注意**: `override_existing_dns_record` オプションは2026年1月時点でバグにより動作しない。

---

## 関連ドキュメント

- [デプロイ全体像](./index.md)
- [カスタムドメイン設定](./custom-domain.md)
- [デプロイ前後チェックリスト](./checklist.md)
