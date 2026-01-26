# Astro 初期構築ルール

プロジェクト構成に応じて適切なドキュメントを参照してください。

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

---

## 関連ドキュメント

- [structure.md](../structure.md) - ディレクトリ構造
- [css.md](../css.md) - CSS設計
- [operations.md](../operations.md) - 運用・ホスティング・Site/Admin連携
