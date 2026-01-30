# Astro 初期構築ルール

プロジェクト構成に応じて適切なドキュメントを参照してください。

> **Warning**
> **Pages非推奨**: 全てWorkersで構築する。Cloudflare PagesではなくCloudflare Workersを使用すること。

---

## プロジェクト構成

```
リポジトリ/
├── front/    ← 公開用HP（静的サイト）
└── admin/    ← 管理画面（SSR）
```

---

## 初期構築ガイド

| プロジェクト | ドキュメント | ビルド方式 |
|-------------|-------------|-----------|
| **front/** | [front.md](./front.md) | SSG（静的生成） |
| **admin/** | [admin.md](./admin.md) | SSR（サーバーサイドレンダリング） |

---

## クイックスタート

### Front のみ（シンプルな静的サイト）

```bash
cp -r .claude/skills/astro-rules/_template/front/ ./front/
cd front && npm install
```

サーバー起動は **chrome-check スキル** を使用すること。
直接 `npm run dev` や `npm run preview` を実行しない。

### Front + Admin（管理画面付き）

```bash
# Front
cp -r .claude/skills/astro-rules/_template/front/ ./front/
cd front && npm install

# Admin
cd ..
cp -r .claude/skills/astro-rules/_template/admin/ ./admin/
cd admin && npm install
cp .dev.vars.example .dev.vars
# .dev.vars を編集して ADMIN_PASSWORD を設定
```

サーバー起動は **chrome-check スキル** を使用すること。

### Cloudflareリソースの準備

adminを本番デプロイする前に、KV/R2の作成とSecretsの設定が必要。
詳細は [cloudflare-resources.md](./cloudflare-resources.md) を参照。

---

## 関連ドキュメント

- [../development/structure.md](../development/structure.md) - ディレクトリ構造
- [../development/css.md](../development/css.md) - CSS設計
- [../deploy/index.md](../deploy/index.md) - デプロイ手順
