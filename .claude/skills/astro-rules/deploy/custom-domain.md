# カスタムドメイン設定

## wrangler.jsonc での設定方法

Workers Static Assets でカスタムドメインを設定するには、`routes` と `custom_domain: true` を使用する。

### 基本構成

```jsonc
{
  "name": "project-name",
  "compatibility_date": "2024-01-01",

  // 静的アセット配信（Workers Static Assets）
  "assets": {
    "directory": "./dist"
  },

  // カスタムドメイン設定
  "routes": [
    { "pattern": "example.com", "custom_domain": true },
    { "pattern": "www.example.com", "custom_domain": true }
  ],

  // 本番公開後はfalseに
  "workers_dev": false
}
```

### ポイント

- `custom_domain: true` を指定すると、Cloudflareが**自動で**：
  - DNSレコードを作成
  - SSL証明書を発行
- ダッシュボードでの手動設定が不要
- デプロイ時にwranglerが全て処理

---

## 具体例

### frontプロジェクト（ルートドメイン + www）

```jsonc
// front/wrangler.jsonc
{
  "name": "hayakawa-front",
  "compatibility_date": "2024-01-01",
  "assets": {
    "directory": "./dist"
  },
  "routes": [
    { "pattern": "hayakawa-gyoza.com", "custom_domain": true },
    { "pattern": "www.hayakawa-gyoza.com", "custom_domain": true }
  ],
  "workers_dev": false
}
```

### adminプロジェクト（サブドメイン）

```jsonc
// admin/wrangler.jsonc
{
  "name": "hayakawa-admin",
  "compatibility_date": "2024-01-01",
  "main": "dist/_worker.js/index.js",
  "routes": [
    { "pattern": "settei.hayakawa-gyoza.com", "custom_domain": true }
  ],
  "workers_dev": false
}
```

---

## DNS移行時の注意

### 既存DNSレコードがある場合

`custom_domain: true` は、**既存のDNSレコードがあると失敗**する。

```
エラー例:
Hostname 'example.com' already has externally managed DNS records (A, CNAME, etc).
Either delete them, try a different hostname, or use the option 'override_existing_dns_record' to override.
```

### 解決方法

1. **先に既存のCNAME/Aレコードを削除**してからデプロイ
2. wranglerがデプロイ時に新しいレコードを自動作成

### 削除していいレコード

| 削除OK | 削除NG |
|--------|--------|
| CNAME（@, www） | MX（メール配送） |
| A（ルート） | TXT（SPF/DKIM） |
| | NS（ネームサーバー） |

### 削除NGのレコード詳細

- **MX**: メール配送に必須。削除するとメールが届かなくなる
- **TXT（SPF）**: メール認証。`v=spf1...` で始まるレコード
- **TXT（DKIM）**: メール認証。`_domainkey` を含むレコード
- **NS**: DNSの基盤。削除すると全てが動かなくなる

---

## override_existing_dns_record バグ

### 注意（2026年1月時点）

wrangler.jsonc に `override_existing_dns_record` オプションがあるが、**バグで動作しない**。

```jsonc
// 動作しない設定例（バグ）
{
  "routes": [
    {
      "pattern": "example.com",
      "custom_domain": true,
      "override_existing_dns_record": true  // ← 機能しない
    }
  ]
}
```

### 参考Issue

[GitHub Issue #9878](https://github.com/cloudflare/workers-sdk/issues/9878)

### 回避策

1. 先に既存DNSレコードを手動削除
2. デプロイ実行
3. wranglerが新しいレコードを自動作成

---

## 移行手順（既存サイトからの移行）

WordPressなど既存サイトからの移行時の手順。

### 1. バックアップ

既存サイトのバックアップを取得。

### 2. 構築段階

```jsonc
{
  "workers_dev": true,  // デフォルトドメインでテスト
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}
```

この段階では既存DNSがあるのでデプロイは失敗するが、`*.workers.dev` でテスト可能。

### 3. DNS切り替え

1. Cloudflareダッシュボードで既存CNAME/Aレコードを削除
2. MX/TXTレコードは**維持**（メール機能保持）
3. デプロイ実行 → wranglerが自動でDNS設定

### 4. 本番公開

```jsonc
{
  "workers_dev": false,  // デフォルトドメイン無効化
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}
```

---

## 確認コマンド

### カスタムドメインでのアクセス確認

```bash
curl -sI https://example.com | head -10
# HTTP/2 200 が返ればOK
```

### SSL証明書確認

```bash
curl -sI https://example.com | grep -i "server:"
# server: cloudflare が返ればOK
```

---

## 関連ドキュメント

- [デプロイ全体像](./index.md)
- [GitHub Actions](./github-actions.md)
- [トラブルシューティング](./troubleshooting.md)
