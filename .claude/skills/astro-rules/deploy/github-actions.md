# GitHub Actions CI/CDワークフロー

## 基本構成

frontとadminで別々のワークフローファイルを用意する。

```
.github/workflows/
├── deploy-front.yml   # frontプロジェクト用
└── deploy-admin.yml   # adminプロジェクト用
```

---

## deploy-front.yml テンプレート

```yaml
name: Deploy Front

on:
  push:
    branches:
      - main
    paths:
      - 'front/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci
        working-directory: front

      - name: Build
        run: npm run build
        working-directory: front

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: front
          wranglerVersion: "4"
          command: deploy --commit-hash=${{ github.sha }} --commit-message="Deploy from GitHub Actions"
```

---

## deploy-admin.yml テンプレート

```yaml
name: Deploy Admin

on:
  push:
    branches:
      - main
    paths:
      - 'admin/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci
        working-directory: admin

      - name: Build
        run: npm run build
        working-directory: admin

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: admin
          wranglerVersion: "4"
          command: deploy --commit-hash=${{ github.sha }} --commit-message="Deploy from GitHub Actions"
```

---

## 重要な設定ポイント

### wranglerVersion: "4" の指定

Workers Static Assetsの新形式（`assets.directory`）は**wrangler 4.x**でサポート。デフォルトでインストールされるバージョンは古い場合があるため、明示的に指定する。

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    wranglerVersion: "4"  # 重要: 明示的に指定
```

### 日本語コミットメッセージ対応

GitHub Actionsからwranglerを実行すると、日本語のコミットメッセージでエラーが発生することがある。

```
エラー例:
Invalid commit message, it must be a valid UTF-8 string
```

**対策**: `--commit-hash` と `--commit-message` を明示的に指定する。

```yaml
command: deploy --commit-hash=${{ github.sha }} --commit-message="Deploy from GitHub Actions"
```

これにより、Gitの日本語コミットメッセージに依存せず、英語の固定メッセージが使用される。

---

## Pages から Workers への移行

既存のPages deployワークフローをWorkers deployに変更する場合。

### Before (Pages)

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    workingDirectory: front
    command: pages deploy dist --project-name=hayakawa-front
```

### After (Workers)

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    workingDirectory: front
    wranglerVersion: "4"
    command: deploy --commit-hash=${{ github.sha }} --commit-message="Deploy from GitHub Actions"
```

### 主な変更点

| 項目 | Pages | Workers |
|------|-------|---------|
| コマンド | `pages deploy dist --project-name=xxx` | `deploy` |
| wranglerVersion | 指定なし（デフォルト） | `"4"` を指定 |
| 出力先指定 | コマンドで `dist` を指定 | `wrangler.jsonc` の `assets.directory` |

---

## Secrets 設定

GitHub リポジトリの Settings > Secrets and variables > Actions で設定。

### 必須

| Secret名 | 説明 |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン |

### APIトークンの権限

以下の権限を持つトークンを作成：

- **Account**: Cloudflare Workers KV Storage:Edit, Cloudflare Workers R2 Storage:Edit
- **Zone**: Workers Routes:Edit
- **User**: Workers Scripts:Edit

---

## paths フィルター

`paths` を指定することで、該当ディレクトリの変更時のみワークフローが実行される。

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'front/**'  # front/ 配下の変更時のみ
```

### 注意点

- ワークフローファイル（`.github/workflows/*.yml`）だけを変更した場合は発火しない
- 手動実行（`workflow_dispatch`）を追加しておくと便利

---

## 手動実行

`workflow_dispatch` を追加すると、GitHubのActionsタブから手動実行可能。

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # 手動実行を有効化
```

### GitHub CLI での手動実行

```bash
gh workflow run deploy-front.yml
```

---

## デプロイ確認

### GitHub Actions ログ確認

```bash
gh run list --workflow=deploy-front.yml --limit=5
```

### 最新runの詳細

```bash
gh run view --workflow=deploy-front.yml
```

### ログ取得

```bash
gh run view --workflow=deploy-front.yml --log
```

---

## 関連ドキュメント

- [デプロイ全体像](./index.md)
- [カスタムドメイン設定](./custom-domain.md)
- [トラブルシューティング](./troubleshooting.md)
