# Cloudflare リソース設定

adminの本番デプロイに必要なCloudflareリソースの作成手順。

---

## 1. KV名前空間の作成

adminはセッション管理とレートリミット用に2つのKV名前空間が必要。

### コマンド

```bash
# セッション管理用
wrangler kv namespace create SESSIONS
# 出力例: { binding = "SESSIONS", id = "abc123..." }

# レートリミット用
wrangler kv namespace create RATE_LIMIT
# 出力例: { binding = "RATE_LIMIT", id = "def456..." }
```

### wrangler.jsoncへの反映

出力されたIDを `wrangler.jsonc` に設定:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSIONS",
    "id": "abc123..."  // ← 実際のIDに置換
  },
  {
    "binding": "RATE_LIMIT",
    "id": "def456..."  // ← 実際のIDに置換
  }
]
```

---

## 2. R2バケットの作成

画像保存用のR2バケットを作成。

### コマンド

```bash
wrangler r2 bucket create your-project-images
# your-project-images はバケット名（プロジェクトに合わせて変更）
```

### wrangler.jsoncへの反映

```jsonc
"r2_buckets": [
  {
    "binding": "IMAGES",
    "bucket_name": "your-project-images"  // ← 作成したバケット名
  }
]
```

---

## 3. Cloudflare APIトークンの取得

GitHub Actionsからのデプロイに必要。

### 手順

1. **Cloudflareダッシュボードにログイン**
   https://dash.cloudflare.com/

2. **APIトークンページに移動**
   - 右上のプロフィールアイコン → 「マイプロフィール」
   - 左メニュー → 「APIトークン」

3. **トークンを作成**
   - 「トークンを作成」をクリック
   - **「Cloudflare Workers を編集する」テンプレートを使用**
   - または以下の権限でカスタム作成:
     - Account > Workers Scripts: Edit
     - Account > Workers KV Storage: Edit
     - Account > Workers R2 Storage: Edit
     - Zone > Workers Routes: Edit（カスタムドメイン使用時）

4. **トークンをコピー**
   - 作成後に表示されるトークンをコピー
   - **この画面を閉じると二度と表示されない**

### Account IDの確認

1. Cloudflareダッシュボードの「Workers & Pages」を開く
2. 右サイドバーに「アカウントID」が表示される

---

## 4. GitHub Secretsの設定

GitHub Actionsからのデプロイに必要なSecretsを設定。

### 手順

1. GitHubリポジトリ → 「Settings」 → 「Secrets and variables」 → 「Actions」

2. 以下のSecretsを追加:

| Secret名 | 値 |
|----------|-----|
| `CLOUDFLARE_API_TOKEN` | 取得したAPIトークン |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID |

### 追加方法

「New repository secret」をクリックして各項目を追加:

```
Name: CLOUDFLARE_API_TOKEN
Secret: 取得したトークン
```

```
Name: CLOUDFLARE_ACCOUNT_ID
Secret: アカウントID
```

---

## 5. ADMIN_PASSWORD の設定

管理画面のログインパスワードをSecretsとして設定。

### コマンド

```bash
wrangler secret put ADMIN_PASSWORD
# プロンプトが表示されるのでパスワードを入力
```

### 注意点

- **wrangler.jsoncには書かない**: Secretsは `wrangler secret put` で設定
- **ローカル開発時は.dev.vars**: `.dev.vars` に `ADMIN_PASSWORD=xxx` を記載
- **Secretsは暗号化される**: Cloudflareダッシュボードでも値は表示されない

### Secretsの確認

```bash
wrangler secret list
# 設定済みのSecret名の一覧が表示される（値は表示されない）
```

---

## 6. リソース作成のチェックリスト

### KV

- [ ] `wrangler kv namespace create SESSIONS` を実行
- [ ] `wrangler kv namespace create RATE_LIMIT` を実行
- [ ] 出力されたIDを `wrangler.jsonc` に反映

### R2

- [ ] `wrangler r2 bucket create {バケット名}` を実行
- [ ] バケット名を `wrangler.jsonc` に反映

### Secrets

- [ ] `wrangler secret put ADMIN_PASSWORD` を実行
- [ ] パスワードを入力

### GitHub Secrets

- [ ] `CLOUDFLARE_API_TOKEN` を設定
- [ ] `CLOUDFLARE_ACCOUNT_ID` を設定

---

## トラブルシューティング

### 「KV namespace not found」エラー

KV IDが間違っているか、作成されていない:

```bash
# 作成済みのKV一覧を確認
wrangler kv namespace list
```

### 「R2 bucket not found」エラー

バケット名が間違っているか、作成されていない:

```bash
# 作成済みのバケット一覧を確認
wrangler r2 bucket list
```

### 「Authentication error」

APIトークンの権限が不足している:

- Cloudflareダッシュボードでトークンの権限を確認
- 必要な権限: Workers Scripts, Workers KV Storage, Workers R2 Storage
