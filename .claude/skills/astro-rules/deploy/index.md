# デプロイ全体像

## 基本方針

**Pages非推奨、Workers Static Assets統一**

2025年4月にCloudflareはPagesを非推奨（deprecated）にし、Workersに統合する方向を発表。今後の全プロジェクトはWorkersで構築する。

| 項目 | Pages（非推奨） | Workers（推奨） |
|------|----------------|-----------------|
| 静的サイト配信 | `pages_build_output_dir` | `assets.directory` |
| デプロイコマンド | `wrangler pages deploy` | `wrangler deploy` |
| カスタムドメイン | ダッシュボード必須 | `routes` + `custom_domain: true`（CLI完結） |
| デフォルトドメイン | `*.pages.dev` | `*.workers.dev` |

---

## デプロイフロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    開発フロー                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ローカル開発                                                │
│       │                                                     │
│       ▼                                                     │
│  wrangler dev（ローカル確認）                                │
│       │                                                     │
│       ▼                                                     │
│  git push（stagingブランチ）                                 │
│       │                                                     │
│       ▼                                                     │
│  workers_dev: true でデプロイ                                │
│       │                                                     │
│       ▼                                                     │
│  *.workers.dev でテスト確認                                  │
│       │                                                     │
│       ▼                                                     │
│  mainブランチにマージ                                        │
│       │                                                     │
│       ▼                                                     │
│  workers_dev: false に変更                                   │
│       │                                                     │
│       ▼                                                     │
│  カスタムドメインのみでアクセス可能                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## workers_dev の仕組み

`wrangler.jsonc` の `workers_dev` 設定で、デフォルトドメイン（`*.workers.dev`）の有効/無効を制御する。

### 設定値の意味

| 設定値 | デフォルトドメイン | 用途 |
|--------|------------------|------|
| `true`（デフォルト） | 有効 | 構築段階でテスト確認用 |
| `false` | 無効（404） | 本番公開後、カスタムドメインのみに |

### 運用フロー

```yaml
# 構築段階のwrangler.jsonc
{
  "workers_dev": true,  # デフォルトドメインでテスト可能
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}

# 本番公開後のwrangler.jsonc
{
  "workers_dev": false,  # デフォルトドメインを無効化
  "routes": [
    { "pattern": "example.com", "custom_domain": true }
  ]
}
```

### メリット

- **Bulk Redirects不要**: `workers_dev: false` にすれば、デフォルトドメインへのアクセスは404になる
- **CLI完結**: ダッシュボードでのリダイレクト設定が不要
- **シンプルな運用**: カスタムドメインのみを管理すればよい

---

## 「ステージング」という概念の誤解

よくある誤解として「デフォルトドメイン = ステージング環境」と考えがちだが、これは**間違い**。

### 実際の構造

```
┌─────────────────────────────────────────┐
│           同じデプロイ先                 │
│           （Workers/R2/KV）             │
│                  ▲                      │
│           ┌─────┴─────┐                 │
│           │           │                 │
│    デフォルトドメイン   カスタムドメイン    │
│    (*.workers.dev)    (example.com)     │
│           │           │                 │
│           └─────┬─────┘                 │
│                 │                       │
│          入り口が2つある状態              │
│          （同じ場所を参照）               │
└─────────────────────────────────────────┘
```

### 重要なポイント

- デフォルトドメインとカスタムドメインは**同じデータを参照**
- 「別環境」ではなく「入り口が2つある」状態
- 本当のステージング環境が必要なら、**別プロジェクト**を作成する

---

## ブランチ戦略（アイデア段階）

将来的な本格運用に向けた参考情報。

### 推奨構成

```
ブランチ構成:
├── staging     # 開発用ブランチ
│   └── ローカルビルドで確認
│   └── workers_dev: true でテスト
│
└── main        # 本番用ブランチ
    └── CI/CDで自動デプロイ
    └── workers_dev: false
    └── カスタムドメインのみ
```

### CI/CDフロー

```yaml
# stagingブランチへのpush
1. ローカルでビルド確認
2. stagingにpush
3. workers_dev: true でデプロイ
4. *.workers.dev でテスト

# mainブランチへのマージ
1. stagingからmainにPR
2. レビュー・承認
3. マージ → 自動デプロイ
4. workers_dev: false でカスタムドメインのみ
```

---

## 関連ドキュメント

- [カスタムドメイン設定](./custom-domain.md)
- [GitHub Actions](./github-actions.md)
- [トラブルシューティング](./troubleshooting.md)
- [デプロイ前後チェックリスト](./checklist.md)
