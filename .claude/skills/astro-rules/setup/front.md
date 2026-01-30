# Front 初期構築ルール

公開用静的サイト（front/）の初期構築手順。

> **Warning**
> **Tailwind CDN禁止**: `<script src="https://cdn.tailwindcss.com">` は使用禁止。
> Astro開発サーバーからCDNにアクセスするとCORSでブロックされる。
> テンプレートに設定済みの `@astrojs/tailwind` 統合を使用すること。

---

## 1. 構築手順

### 基本フロー

1. **テンプレートをコピー**
   ```bash
   cp -r .claude/skills/astro-rules/_template/front/ ./front/
   ```

2. **依存パッケージをインストール**
   ```bash
   cd front && npm install
   ```

3. **開発サーバーを起動**

   **chrome-check スキル** を使用すること。
   ```
   「frontを起動して」
   「frontをDevToolsで確認」
   ```

4. **ブラウザで確認**
   - http://localhost:8788 にアクセス
   - エラーなくページが表示されればOK

---

## 2. 静的ファイルの配置ルール

### 画像ファイル

静的ファイルは必ず `/images/` 配下に配置する。

```
front/
└── public/
    └── images/          ← 画像はここに配置
        ├── hero.webp
        ├── logo.webp
        └── placeholder.webp
```

**ルート直下への配置は禁止**:
```
# NG
public/hero.webp
public/favicon.ico

# OK
public/images/hero.webp
public/favicon.ico  ← favicon.icoのみ例外
```

### .assetsignore

`.assetsignore` ファイルを使用すると、特定のファイルをビルド対象から除外できる。

```
# front/.assetsignore
*.psd
*.ai
_drafts/
```

開発用ファイルや素材ファイルを `public/` に置いておきながら、本番ビルドから除外する場合に使用する。

---

## 3. テンプレートの設計思想

### ローファイ・最小限

- テンプレートは「エラーなく表示される」最小限の状態
- 見た目はほぼ真っ白、プレースホルダーのみ
- デザインカンプからの構築は別スキルで行う

### 不要なら消す

- StickyHeader、StickyFooterNav等はデフォルトで含まれている
- 案件で不要なら削除すればよい
- 最初から入れておくことで「あとから追加」の手間を省く

### 柔軟に更新

- テンプレートは完璧を目指さない
- 問題が起きたら直す、新しい知見があれば追加する
- Git管理しているので変更履歴は追える

---

## 4. package.json の方針

### バージョン指定

```json
{
  "dependencies": {
    "@astrojs/tailwind": "^6.0.0",
    "astro": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

- **キャレット（^）付き**で指定
- `npm install` 時に互換性のある最新版が入る
- メジャーバージョンは固定、マイナー・パッチは最新

### 更新タイミング

- テンプレート自体のバージョン更新は年1回程度で十分
- 破壊的変更があった場合のみ対応

---

## 5. テンプレート各ファイルの役割

### 設定ファイル

| ファイル | 役割 |
|----------|------|
| `package.json` | 依存パッケージの定義 |
| `astro.config.mjs` | Astro設定（Tailwind統合含む） |
| `tailwind.config.mjs` | Tailwind設定（preflight無効化） |
| `tsconfig.json` | TypeScript設定（Astroデフォルト） |

### src/ ディレクトリ

| ディレクトリ/ファイル | 役割 |
|----------------------|------|
| `layouts/Base.astro` | HTML外枠（html/head/body） |
| `pages/index.astro` | トップページ（セクションを並べる） |
| `sections/01-Hero.astro` | ヒーローセクション雛形 |
| `sections/02-Section.astro` | 汎用セクション雛形 |
| `sections/99-Footer.astro` | フッターセクション |
| `components/StickyHeader.astro` | 上部固定ヘッダー（バーガーメニュー等） |
| `components/StickyFooterNav.astro` | 下部固定ナビ（スマホ用CTA） |
| `styles/global.css` | CSS変数、リセット |
| `lib/content.ts` | admin API 連携用 |

### public/ ディレクトリ

| ディレクトリ | 役割 |
|-------------|------|
| `images/` | 静的画像の配置場所 |

---

## 6. Admin連携（オプション）

admin/ と連携してコンテンツを取得する場合:

```typescript
// src/lib/content.ts を使用
import { fetchContentSafe } from '../lib/content';

// ビルド時にadmin APIからコンテンツ取得
const content = await fetchContentSafe('https://your-admin.pages.dev');
```

詳細は [../deploy/site-admin.md](../deploy/site-admin.md) の「Site/Admin連携」を参照。

---

## 7. HTMLからの移行時の注意点

### Tailwind CDN は使えない

**問題:**
- 元のHTMLでは `<script src="https://cdn.tailwindcss.com">` を使用
- Astro開発サーバーからCDNにアクセスするとCORSでブロック

**解決:**
- `@astrojs/tailwind` 統合を使用（テンプレートに設定済み）
- CDNではなくビルド時にTailwindを処理

### スコープ付きCSSと動的生成要素

**問題:**
- Astroの `<style>` はデフォルトでスコープ付き
- JSで動的に生成したDOM要素にはスタイルが当たらない

**解決:**
- 動的生成要素がある場合は `<style is:global>` を使用
- 詳細は [../development/css.md](../development/css.md) の「スコープ付きCSSと動的生成要素」を参照

---

## チェックリスト

### 初期構築時

- [ ] テンプレートをコピーしたか
- [ ] `npm install` を実行したか
- [ ] chrome-checkスキルでサーバーが起動するか
- [ ] ブラウザでエラーなく表示されるか

### 移行時（既存HTMLから）

- [ ] Tailwind CDNの記述を削除したか
- [ ] JSで動的生成する要素に `is:global` を使っているか
- [ ] 静的ファイルを `/images/` 配下に配置したか
