---
name: astro-rules
description: Astroプロジェクトの構造・CSS・コンポーネント設計のルール集。構造変更・セクション作成・ディレクトリ操作時に参照する。運用・Cloudflare設定も含む。
user-invocable: false
---

# Astro プロジェクトルール

Astroプロジェクトの品質を均一化するためのルール集。

---

## 3フェーズ構造

このスキルは以下の3フェーズで構成されている。作業内容に応じて適切なフェーズを参照する。

```
Phase 1: setup/       ← 初回セットアップ
Phase 2: development/ ← 開発
Phase 3: deploy/      ← デプロイ
```

---

## Phase 1: セットアップ（setup/）

新規プロジェクトの初期構築時に参照。

| ドキュメント | 内容 |
|-------------|------|
| `setup/index.md` | 概要、クイックスタート |
| `setup/front.md` | 公開用HP（SSG）構築手順 |
| `setup/admin.md` | 管理画面（SSR）構築手順 |
| `setup/cloudflare-resources.md` | KV/R2作成、APIトークン、GitHub Secrets |

**テンプレート:**
- `_template/front/` - 公開用HP
- `_template/admin/` - 管理画面

---

## Phase 2: 開発（development/）

日常的な開発作業時に参照。

| ドキュメント | 内容 |
|-------------|------|
| `development/structure.md` | ディレクトリ構造、コンポーネント設計 |
| `development/css.md` | CSS設計ルール、Tailwind |
| `development/workflow.md` | 開発フロー、ポート規則、環境変数 |
| `development/front-admin-api.md` | Front/Admin API連携、CORS設定 |

---

## Phase 3: デプロイ（deploy/）

Cloudflareへのデプロイ時に参照。

| ドキュメント | 内容 |
|-------------|------|
| `deploy/index.md` | デプロイ全体像、Workers統一方針 |
| `deploy/custom-domain.md` | カスタムドメイン設定、DNS注意点 |
| `deploy/github-actions.md` | CI/CDワークフロー |
| `deploy/troubleshooting.md` | トラブルシューティング |
| `deploy/checklist.md` | デプロイ前後チェックリスト |

---

## 参照タイミング

以下の作業時にこのスキルを参照する：

### Phase 1: セットアップ
- 新規Astroプロジェクトの初期構築
- Cloudflareリソース（KV/R2）の作成
- GitHub Secrets設定

### Phase 2: 開発
- Astroディレクトリ構造の作成・変更
- 新規セクション・コンポーネントの作成
- レイアウトファイルの作成・編集
- CSSの作成・レビュー・整形
- **開発サーバー起動時**（ポート規則の確認）
- Front/Admin連携の実装

### Phase 3: デプロイ
- Cloudflare設定・デプロイ
- カスタムドメイン設定
- GitHub Actions CI/CD設定
- トラブルシューティング
- 運用規模の相談

---

## 重要な方針

### Pages非推奨 → Workers統一

2025年4月以降、CloudflareはPagesを非推奨にし、Workersへの統合を発表。
**今後は全てWorkers（Workers Static Assets含む）で構築する。**

詳細は `deploy/index.md` を参照。

---

## 使用方法

必要に応じて各フェーズのルールファイルを参照し、ルールに従って実装する。
