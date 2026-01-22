---
name: css-rules
description: CSS作成時のルール参照・レビュー・整形を行う
user-invocable: true
---

# CSS作成ルール

CSSの品質を均一化するためのルール集。作成・レビュー・整形時に参照する。

---

## 使用方法

### モード選択

1. **参照**: ルール一覧を確認したいとき
2. **レビュー**: 既存CSSがルールに沿っているかチェック
3. **整形**: ルールに従ってCSSを修正

ユーザーの指示に応じて適切なモードで対応する。

---

## ルール概要

### 1. リセット・基本設定

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

- 全要素に `border-box` を適用
- Tailwind preflight は無効化（ブラウザデフォルト維持）

### 2. CSS変数

数値を含む値は `:root` で変数化する。

| カテゴリ | プレフィックス | 例 |
|----------|----------------|-----|
| 色 | `--color-` | `--color-primary`, `--color-text` |
| 余白 | `--space-` | `--space-sm`, `--space-md` |
| フォント | `--font-size-` | `--font-size-base` |
| 角丸 | `--radius-` | `--radius-sm` |
| シャドウ | `--shadow-` | `--shadow-card` |

**spacing基準**: Tailwindの4px単位（1=4px, 2=8px, 4=16px...）

### 3. Tailwind優先

- 基本はTailwindユーティリティで実装
- Tailwindで表現できない場合のみカスタムCSS
- カスタムCSSはセクション単位でBEM命名

### 4. レスポンシブ

- **モバイルファースト**（min-width でブレークアップ）
- 最小幅: 375px
- PC上限: 900px（max-width で中央寄せ）

### 5. BEM命名（カスタムCSS）

```
.section-XX          ← ブロック（セクション単位）
.section-XX__element ← 要素
.section-XX--modifier← 修飾子
```

### 6. Astro移行を見据えた設計

- CSS変数は `:root` に集約
- コンポーネント固有スタイルは分離しやすく記述

---

## 詳細ルール

詳細な例やコード例は `REFERENCE.md` を参照。
