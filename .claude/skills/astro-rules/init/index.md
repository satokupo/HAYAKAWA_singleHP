# Astro 初期構築ルール

プロジェクト構成に応じて適切なドキュメントを参照してください。

---

## プロジェクト構成

```
リポジトリ/
├── site/     ← 公開用HP（静的サイト）
└── admin/    ← 管理画面（SSR）
```

---

## 初期構築ガイド

| プロジェクト | ドキュメント | ビルド方式 |
|-------------|-------------|-----------|
| **site/** | [site.md](./site.md) | SSG（静的生成） |
| **admin/** | [admin.md](./admin.md) | SSR（サーバーサイドレンダリング） |

---

## クイックスタート

### Site のみ（シンプルな静的サイト）

```bash
cp -r .claude/skills/astro-rules/_template/site/ ./site/
cd site && npm install
```

サーバー起動は **chrome-check スキル** を使用すること。
直接 `npm run dev` や `npm run preview` を実行しない。

### Site + Admin（管理画面付き）

```bash
# Site
cp -r .claude/skills/astro-rules/_template/site/ ./site/
cd site && npm install

# Admin
cd ..
cp -r .claude/skills/astro-rules/_template/admin/ ./admin/
cd admin && npm install
cp .dev.vars.example .dev.vars
# .dev.vars を編集して ADMIN_PASSWORD を設定
```

サーバー起動は **chrome-check スキル** を使用すること。

---

## 関連ドキュメント

- [structure.md](../structure.md) - ディレクトリ構造
- [css.md](../css.md) - CSS設計
- [operations.md](../operations.md) - 運用・ホスティング・Site/Admin連携
