# CSS作成ルール 詳細リファレンス

SKILL.md のルールに基づく詳細な例とコードサンプル。

---

## 1. リセット・基本設定

### 必須リセット

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### Tailwind設定

```html
<script>
  tailwind.config = {
    corePlugins: {
      preflight: false
    }
  }
</script>
```

preflightを無効化することで、ブラウザのデフォルトスタイルを維持する。

---

## 2. CSS変数

### 変数定義テンプレート

```css
:root {
  /* === Colors === */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-bg: #ffffff;
  --color-bg-alt: #f8fafc;
  --color-border: #e2e8f0;

  /* === Spacing (4px単位) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* === Font Sizes === */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* === Shadows === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### 変数の使用例

```css
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.card__title {
  font-size: var(--font-size-xl);
  color: var(--color-text);
  margin-bottom: var(--space-2);
}
```

### Tailwindとの対応表

| 変数 | Tailwind | 値 |
|------|----------|-----|
| `--space-1` | `p-1` | 4px |
| `--space-2` | `p-2` | 8px |
| `--space-4` | `p-4` | 16px |
| `--space-6` | `p-6` | 24px |
| `--space-8` | `p-8` | 32px |

---

## 3. Tailwind優先

### 判断基準

| 状況 | 使用するもの |
|------|-------------|
| 基本的なレイアウト・余白・色 | Tailwind |
| 複雑なアニメーション | カスタムCSS |
| 疑似要素（::before, ::after） | カスタムCSS |
| 複数プロパティのセット | カスタムCSS（変数活用） |
| 条件付きスタイル | Tailwind（レスポンシブ対応） |

### Tailwindでの実装例

```html
<!-- 良い例: シンプルなレイアウト -->
<div class="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 class="text-xl font-bold text-gray-800">タイトル</h2>
  <p class="text-gray-600">本文テキスト</p>
</div>
```

### カスタムCSSが必要な例

```css
/* 複雑な装飾 */
.section-01__heading::after {
  content: "";
  display: block;
  width: 60px;
  height: 3px;
  background: var(--color-primary);
  margin-top: var(--space-2);
}

/* グラデーション背景 */
.section-02 {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-accent) 100%
  );
}
```

---

## 4. レスポンシブ

### ブレークポイント

```css
/* モバイルファースト: 基本スタイルはモバイル用 */
.container {
  padding: var(--space-4);
}

/* タブレット以上 */
@media (min-width: 640px) {
  .container {
    padding: var(--space-6);
  }
}

/* PC */
@media (min-width: 900px) {
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-8);
  }
}
```

### Tailwindでのレスポンシブ

```html
<div class="p-4 sm:p-6 md:p-8 max-w-[900px] mx-auto">
  コンテンツ
</div>
```

---

## 5. BEM命名

### 基本構造

```css
/* ブロック: セクション単位 */
.section-01 {
  /* セクション全体のスタイル */
}

/* 要素: ブロック内のパーツ */
.section-01__inner {
  /* 内側のラッパー */
}

.section-01__heading {
  /* 見出し */
}

.section-01__text {
  /* 本文 */
}

.section-01__image {
  /* 画像 */
}

/* 修飾子: バリエーション */
.section-01--dark {
  /* ダークテーマ版 */
}

.section-01__button--primary {
  /* プライマリボタン */
}
```

### HTML構造例

```html
<section class="section-01" id="about">
  <div class="section-01__inner">
    <h2 class="section-01__heading">About Us</h2>
    <p class="section-01__text">会社紹介テキスト</p>
    <img
      class="section-01__image"
      src="images/about.webp"
      alt="会社外観"
      width="600"
      height="400"
      loading="lazy"
    >
  </div>
</section>
```

---

## 6. Astro移行

### 現在（1枚HTML）

```html
<style>
  :root {
    --color-primary: #2563eb;
    /* ... */
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .section-01 { /* ... */ }
</style>
```

### Astro移行後

```
src/
├── styles/
│   └── global.css      ← :root変数、リセット
├── components/
│   ├── Section01.astro ← コンポーネント固有スタイル
│   └── Section02.astro
└── pages/
    └── index.astro
```

**global.css**
```css
:root {
  --color-primary: #2563eb;
  /* ... */
}

*, *::before, *::after {
  box-sizing: border-box;
}
```

**Section01.astro**
```astro
---
// コンポーネントロジック
---

<section class="section-01" id="about">
  <div class="section-01__inner">
    <!-- コンテンツ -->
  </div>
</section>

<style>
  .section-01 {
    /* このコンポーネント固有のスタイル */
    /* Astroが自動でスコープ化 */
  }
</style>
```

---

## チェックリスト

### 新規CSS作成時

- [ ] `box-sizing: border-box` が適用されているか
- [ ] 色・余白・サイズは変数で定義されているか
- [ ] Tailwindで書ける部分はTailwindを使っているか
- [ ] カスタムCSSはBEM命名に従っているか
- [ ] モバイルファーストで書かれているか

### レビュー時

- [ ] マジックナンバー（直接の数値）がないか
- [ ] 重複した色指定がないか
- [ ] レスポンシブは min-width で書かれているか
- [ ] 不要なベンダープレフィックスがないか
