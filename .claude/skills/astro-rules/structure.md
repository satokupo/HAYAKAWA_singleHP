# Astro ディレクトリ構造・コンポーネント設計

Astroプロジェクトの標準構造とコンポーネント設計ルール。

---

## 1. ディレクトリ構造

```
astro/
├── src/
│   ├── pages/              ← ページ（URLに対応）
│   │   └── index.astro     ← トップページ
│   ├── layouts/            ← ページ共通レイアウト
│   │   └── Base.astro      ← 基本レイアウト（html/head/body）
│   ├── sections/           ← セクション（大きなページ区切り）
│   │   ├── 01-Hero.astro
│   │   ├── 02-Menu.astro
│   │   ├── 03-ShopInfo.astro
│   │   └── 04-Footer.astro
│   ├── components/         ← 再利用パーツ（小さい）
│   │   ├── StickyNav.astro ← 固定ナビ
│   │   └── Button.astro    ← 汎用ボタン（必要時に追加）
│   └── styles/
│       └── global.css      ← CSS変数、リセット
├── public/                 ← 静的ファイル（そのままコピー）
│   └── images/
├── astro.config.mjs        ← Astro設定
└── package.json
```

---

## 2. 各ディレクトリの役割

### pages/

- **URLに対応**するファイルを配置
- `index.astro` → `/`
- `about.astro` → `/about`
- レイアウトを呼び出し、セクションを並べる

### layouts/

- **HTMLの外枠**（html/head/body）を定義
- 複数ページで共通の構造を提供
- `<slot />` で各ページの中身を挿入

### sections/

- **ページの大きな区切り**（セクション）
- ナンバリングプレフィックス付き（01-, 02-...）
- 1セクション = 1ファイル

### components/

- **再利用可能な小さいパーツ**
- 固定ナビ、ボタン、カードなど
- 最初はフラット、増えたら `ui/` `common/` に分類

---

## 3. ファイル命名規則

### セクション

```
sections/
├── 01-Hero.astro       ← ナンバリング + PascalCase
├── 02-Menu.astro
├── 03-ShopInfo.astro
└── 04-Footer.astro
```

- **プレフィックス**: 並び順を示す（01-, 02-...）
- **名前**: PascalCase（Hero, Menu, ShopInfo）

### コンポーネント

```
components/
├── StickyNav.astro     ← PascalCase
├── Button.astro
└── Card.astro
```

- ナンバリングなし
- PascalCase

---

## 4. .astroファイルの基本構造

```astro
---
// フロントマター（ビルド時に実行されるJS）
// インポート、変数定義、データフェッチ等
import SomeComponent from '../components/SomeComponent.astro';

const title = "セクションタイトル";
const items = ["項目1", "項目2", "項目3"];
---

<!-- テンプレート部分（HTML） -->
<section class="section-01">
  <h2>{title}</h2>
  <ul>
    {items.map(item => <li>{item}</li>)}
  </ul>
  <SomeComponent />
</section>

<style>
  /* スコープ付きCSS（このコンポーネント内のみ適用） */
  .section-01 {
    padding: var(--space-8);
  }
</style>
```

**ポイント:**
- `---` で囲まれた部分 = フロントマター
- `{変数}` で値を埋め込み
- `<style>` はデフォルトでスコープ付き（他に漏れない）

---

## 5. layoutsとpagesの関係

### layouts/Base.astro

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <!-- 共通のmeta、CSS、fonts等 -->
</head>
<body>
  <slot />  <!-- ★ここに各ページの中身が入る -->
</body>
</html>
```

### pages/index.astro

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../sections/01-Hero.astro';
import Menu from '../sections/02-Menu.astro';
import ShopInfo from '../sections/03-ShopInfo.astro';
import Footer from '../sections/04-Footer.astro';
import StickyNav from '../components/StickyNav.astro';
---

<Base title="早川餃子">
  <!-- ↓ これが <slot /> に入る -->
  <StickyNav />
  <main>
    <Hero />
    <Menu />
    <ShopInfo />
  </main>
  <Footer />
</Base>
```

**pages/index.astro の役割:**
- レイアウトを選ぶ
- セクションを並べる順番を決める
- ページ固有のデータを渡す

---

## 6. スタイルの配置

### 方針: セクション単位でスタイルを管理

**原則: グローバルは最小限、セクションごとに独立**

| 配置場所 | 入れるもの |
|----------|-----------|
| `styles/global.css` | CSS変数、リセット、body基本設定のみ |
| 各セクションの `<style>` | セクション固有のスタイル全て |

グローバルは最小限に抑え、セクションごとに独立したスタイルを持たせる。
これにより、セクション単位での修正・差し替えが容易になる。

### グローバルスタイル（styles/global.css）

- CSS変数（:root）
- リセット
- body基本設定（フォント、背景色など）

```css
:root {
  --color-primary: #xxx;
  /* ... */
}

*, *::before, *::after {
  box-sizing: border-box;
}
```

### コンポーネント固有スタイル

各 `.astro` ファイル内の `<style>` タグ：

```astro
<style>
  /* このコンポーネント内のみ適用 */
  .hero {
    height: 95lvh;
  }
</style>
```

- **スコープ付き**（自動で他に漏れない）
- Tailwindと併用可能

---

## 7. 階層の考え方

```
小さい ←――――――――――――――――――→ 大きい

  components    sections    layouts    pages
  (パーツ)      (区切り)    (外枠)     (ページ)
    ↓             ↓           ↓          ↓
  Button      01-Hero      Base      index
  Card        02-Menu
  StickyNav   03-ShopInfo
```

- **components**: 再利用可能な最小パーツ
- **sections**: ページの大きな区切り（コンポーネントを組み合わせ）
- **layouts**: html/head/bodyの外枠
- **pages**: レイアウト＋セクションを並べる

---

## チェックリスト

### 新規セクション作成時

- [ ] `sections/` に配置しているか
- [ ] ナンバリングプレフィックス付きか（01-, 02-...）
- [ ] PascalCaseで命名しているか
- [ ] `<style>` でスコープ付きCSSを使っているか

### 新規コンポーネント作成時

- [ ] `components/` に配置しているか
- [ ] 再利用可能な粒度か
- [ ] PascalCaseで命名しているか

### ページ作成時

- [ ] レイアウトをインポートしているか
- [ ] セクションを正しい順番で並べているか
