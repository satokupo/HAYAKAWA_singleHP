---
name: astro-rules
description: Astroプロジェクトの構造・CSS・コンポーネント設計のルール集。構造変更・セクション作成・ディレクトリ操作時に参照する。運用・Cloudflare設定も含む。
user-invocable: false
---

# Astro プロジェクトルール

Astroプロジェクトの品質を均一化するためのルール集。

---

## 参照タイミング

以下の作業時にこのスキルを参照する：

- 新規Astroプロジェクトの初期構築
- Astroディレクトリ構造の作成・変更
- 新規セクション・コンポーネントの作成
- レイアウトファイルの作成・編集
- CSSの作成・レビュー・整形
- .astroファイルの作成
- Cloudflare設定・デプロイ
- SSR実装
- 運用規模の相談
- **開発サーバー起動時**（ポート規則の確認）

---

## 初期構築

新規プロジェクト作成時は以下を参照：

| 用途 | ドキュメント | テンプレート |
|------|-------------|-------------|
| 公開用HP（SSG） | `init/front.md` | `_template/front/` |
| 管理画面（SSR） | `init/admin.md` | `_template/admin/` |

- `init/index.md` - 概要とクイックスタート

---

## ルールファイル

### init/

初期構築ルール：
- `index.md` - 概要、クイックスタート
- `front.md` - 公開用HP の構築手順
- `admin.md` - 管理画面の構築手順（Cloudflare KV/R2設定含む）

### structure.md

ディレクトリ構造とコンポーネント設計：
- Astro標準ディレクトリ構造
- layouts / sections / components の役割
- ファイル命名規則
- .astroファイルの基本構造

### css.md

CSS作成ルール：
- リセット・基本設定
- CSS変数
- Tailwind優先
- Astroの`<style>`タグ（スコープ付き / is:global）
- レスポンシブ
- BEM命名
- ビューポート高さ（svh/lvh）

### operations.md

運用・ホスティング設定：
- リポジトリ内ディレクトリ構成（front / admin）
- Cloudflare構成（Pages, R2, KV）
- Astro SSR + Cloudflare Adapter
- 無料枠と運用規模の目安
- 複数クライアント運用
- キャッシュ対策
- **Front/Admin連携**（APIでコンテンツ取得）

### development.md

開発フロー：
- **構築順序**（front → admin → 連携 → デプロイ）
- **開発サーバーポート規則**（admin: 8788, front: 8789）
- npm run dev を使わない理由
- 環境変数の設定

---

## 使用方法

必要に応じて各ルールファイルを参照し、ルールに従って実装する。
