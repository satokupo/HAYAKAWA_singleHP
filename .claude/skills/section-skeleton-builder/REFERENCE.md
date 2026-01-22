# セクション骨組み作成スキル - リファレンス

## Pythonスクリプト詳細

### placeholder_generator.py

プレースホルダー画像を生成するスクリプト。

#### 基本使用法
```bash
# 仮想環境を使用
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/placeholder_generator.py [オプション]
```

#### オプション
| オプション | 説明 | 例 |
|-----------|------|-----|
| `--batch`, `-b` | バッチ生成 | `"hero:600x400,menu:300x300"` |
| `--output`, `-o` | 出力ディレクトリ | `./sample/images` |
| `--size`, `-s` | 単一画像のサイズ | `600x400` |
| `--name`, `-n` | 単一画像のファイル名 | `hero.webp` |
| `--config`, `-c` | JSONコンフィグ | `images.json` |
| `--ext`, `-e` | デフォルト拡張子 | `.webp` |
| `--text`, `-t` | カスタムテキスト | `"メイン画像"` |

#### 使用例
```bash
# 複数画像を一括生成
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/placeholder_generator.py \
  --batch "hero-main:750x1334,section-bg:390x600,menu-1:300x300,menu-2:300x300,menu-3:300x300" \
  --output ./sample/images

# 単一画像を生成
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/placeholder_generator.py \
  --size 600x400 --name gallery-1.webp --output ./sample/images

# JSONコンフィグから生成
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/placeholder_generator.py \
  --config images.json --output ./sample/images
```

#### JSONコンフィグ形式
```json
{
  "images": [
    {"name": "hero.webp", "width": 750, "height": 1334},
    {"name": "menu-1.webp", "width": 300, "height": 300},
    {"name": "gallery-1.webp", "width": 600, "height": 400}
  ]
}
```

---

### image_processor.py

既存画像のリサイズ・WebP変換を行うスクリプト。

#### 基本使用法
```bash
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/image_processor.py \
  --input ./raw_images --output ./sample/images
```

#### オプション
| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--input`, `-i` | 入力ディレクトリ | 必須 |
| `--output`, `-o` | 出力ディレクトリ | 必須 |
| `--max-width`, `-W` | 最大幅 | 1200 |
| `--max-height`, `-H` | 最大高さ | 制限なし |
| `--quality`, `-q` | 品質 (1-100) | 85 |
| `--keep-format`, `-k` | WebP変換しない | false |
| `--flatten`, `-f` | フラット出力 | false |

---

## 画像サイズ規約

### 推奨サイズ
| 用途 | サイズ | 備考 |
|------|--------|------|
| ヒーロー画像（縦長） | 750x1334 | iPhone 8相当 |
| セクション背景 | 390x600〜900 | 画面幅に合わせる |
| メニュー・サムネイル | 300x300 | 正方形 |
| ギャラリー画像 | 600x400 | 3:2比率 |
| アイコン | 80x80〜120x120 | 用途に応じて |

### ファイル形式
- **推奨**: WebP
- **透過必要時**: PNG
- **写真**: WebP（quality 80-85）

---

## 既存セクション構造例

### section-01（ヒーロー）
```html
<section class="section-01" id="hero">
  <div class="section-01__inner">
    <header class="section-01__header">
      <h1 class="section-01__title">HAYAKAWA</h1>
      <p class="section-01__subtitle">一口餃子専門店</p>
    </header>
    <div class="section-01__visual">
      <img src="images/hero-main.webp" alt="..." width="750" height="1334">
    </div>
    <div class="section-01__copy">
      <p>カフェみたいな、餃子屋。</p>
    </div>
  </div>
</section>
```

### section-04（メニュー）
```html
<section class="section-04" id="menu">
  <div class="section-04__inner">
    <h2 class="section-04__title">MENU</h2>
    <div class="menu__main">
      <img id="menu-main-image" src="images/menu-1.webp" alt="..." width="300" height="300">
    </div>
    <div class="menu__info">
      <h3 id="menu-name">商品名</h3>
      <p id="menu-price">¥000〜</p>
      <p id="menu-description">説明</p>
    </div>
    <div class="menu__carousel">
      <div class="menu__carousel-track">
        <!-- JSで動的生成 -->
      </div>
    </div>
  </div>
</section>
```

---

## チェックリスト

### 画像生成前
- [ ] 必要な画像をリストアップ
- [ ] サイズを決定
- [ ] ファイル名を決定（小文字、ハイフン区切り）

### HTML作成後
- [ ] セクションIDが一意
- [ ] クラス名がBEM記法
- [ ] 画像にwidth/height属性
- [ ] alt属性が適切
- [ ] loading="lazy"（ファーストビュー以外）

### 統合前
- [ ] 既存CSSとの競合確認
- [ ] モバイル表示確認
- [ ] JavaScriptの初期化（必要な場合）
