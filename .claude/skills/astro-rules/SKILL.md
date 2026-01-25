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

---

## ルールファイル

### init.md

初期構築ルール：
- 構築手順（テンプレートコピー → npm install）
- テンプレートの設計思想
- HTMLからの移行時の注意点

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
- リポジトリ内ディレクトリ構成（site / admin）
- Cloudflare構成（Pages, R2, KV）
- Astro SSR + Cloudflare Adapter
- 無料枠と運用規模の目安
- 複数クライアント運用
- キャッシュ対策

---

## 使用方法

必要に応じて各ルールファイルを参照し、ルールに従って実装する。
