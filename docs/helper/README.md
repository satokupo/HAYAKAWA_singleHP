# HP制作用 画像ヘルパーツール

1ページホームページ制作で使用する画像処理ツール集です。

## 必要環境

- Python 3.10以上
- Pillow（画像処理ライブラリ）

```bash
# Pillowのインストール
.venv/Scripts/pip.exe install Pillow
```

---

## ツール一覧

| ファイル | 用途 |
|----------|------|
| `placeholder_generator.py` | プレースホルダー画像の生成 |
| `image_processor.py` | 既存画像のリサイズ・変換・リネーム |

---

## 1. placeholder_generator.py

### 概要
HP制作時の仮画像（プレースホルダー）を一括生成するツール。
画像サイズとファイル名を表示したダミー画像を作成します。

### 基本的な使い方

```bash
# 単一画像を生成
python placeholder_generator.py --size 600x400 --name hero.webp --output ./images

# 複数画像を一括生成
python placeholder_generator.py --batch "hero:600x400,menu-1:300x300,gallery-1:400x300" --output ./images

# JSON設定ファイルから生成
python placeholder_generator.py --config images.json --output ./images
```

### オプション一覧

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--config` | `-c` | JSON設定ファイルを指定 |
| `--output` | `-o` | 出力ディレクトリ（デフォルト: `./images`） |
| `--size` | `-s` | 画像サイズ（例: `600x400`） |
| `--name` | `-n` | 出力ファイル名 |
| `--batch` | `-b` | 一括生成（例: `hero:600x400,menu:300x300`） |
| `--ext` | `-e` | デフォルト拡張子（デフォルト: `.webp`） |

### JSON設定ファイル形式

```json
{
  "images": [
    {"name": "hero.webp", "width": 1200, "height": 600},
    {"name": "menu-1.webp", "width": 300, "height": 300},
    {"name": "menu-2.webp", "width": 300, "height": 300},
    {"name": "gallery-1.webp", "width": 400, "height": 300}
  ]
}
```

### 出力形式
- WebP（推奨）
- PNG
- SVG
- JPG/JPEG

---

## 2. image_processor.py

### 概要
既存画像のリサイズ、WebP変換、リネームを一括処理するツール。
クライアントから受け取った画像を本番用に最適化します。

### 基本的な使い方

```bash
# ディレクトリ内の画像を一括処理（最大幅1200px、WebP変換）
python image_processor.py --input ./raw_images --output ./images

# 最大サイズを指定
python image_processor.py -i ./raw -o ./images --max-width 800 --max-height 600

# WebPに変換せず元の形式を維持
python image_processor.py -i ./raw -o ./images --keep-format

# JSON設定ファイルでリネーム処理
python image_processor.py --config images.json -i ./raw -o ./images
```

### オプション一覧

| オプション | 短縮 | 説明 |
|-----------|------|------|
| `--input` | `-i` | 入力ディレクトリ（必須） |
| `--output` | `-o` | 出力ディレクトリ（必須） |
| `--config` | `-c` | JSON設定ファイル（リネーム対応） |
| `--max-width` | `-W` | 最大幅（デフォルト: 1200） |
| `--max-height` | `-H` | 最大高さ（デフォルト: 制限なし） |
| `--quality` | `-q` | 画像品質 1-100（デフォルト: 85） |
| `--keep-format` | `-k` | WebPに変換せず元の形式を維持 |
| `--no-recursive` | `-nr` | サブディレクトリを処理しない |
| `--flatten` | `-f` | 出力をフラットにする |
| `--info` | - | 指定画像の情報を表示 |

### JSON設定ファイル形式（リネーム対応）

```json
{
  "images": [
    {"input": "DSC_0001.jpg", "output": "hero.webp"},
    {"input": "DSC_0002.jpg", "output": "about-bg.webp", "max_width": 1920},
    {"input": "DSC_0003.png", "output": "menu-1.webp", "max_width": 400, "quality": 90}
  ],
  "default": {
    "max_width": 1200,
    "max_height": null,
    "quality": 85,
    "convert_to_webp": true
  }
}
```

#### 設定項目

| キー | 説明 | デフォルト |
|------|------|-----------|
| `input` | 入力ファイル名（必須） | - |
| `output` | 出力ファイル名 | inputと同じ |
| `max_width` | 最大幅 | 1200 |
| `max_height` | 最大高さ | 制限なし |
| `quality` | 画像品質 | 85 |
| `convert_to_webp` | WebP変換するか | true |

---

## HP制作ワークフロー例

### 1. 制作初期（プレースホルダー作成）

デザインに合わせて仮画像を生成：

```bash
# 設定ファイルを作成
echo '{
  "images": [
    {"name": "hero.webp", "width": 1200, "height": 600},
    {"name": "about-bg.webp", "width": 1920, "height": 800},
    {"name": "menu-1.webp", "width": 300, "height": 300},
    {"name": "menu-2.webp", "width": 300, "height": 300}
  ]
}' > placeholder_config.json

# プレースホルダー生成
python placeholder_generator.py -c placeholder_config.json -o ./sample/images
```

### 2. 本番画像差し替え

クライアントから画像を受け取ったら：

```bash
# 設定ファイルを作成
echo '{
  "images": [
    {"input": "client_hero.jpg", "output": "hero.webp"},
    {"input": "client_bg.png", "output": "about-bg.webp", "max_width": 1920},
    {"input": "menu_photo1.jpg", "output": "menu-1.webp", "max_width": 400},
    {"input": "menu_photo2.jpg", "output": "menu-2.webp", "max_width": 400}
  ],
  "default": {"quality": 85}
}' > image_config.json

# 画像処理実行
python image_processor.py -c image_config.json -i ./client_images -o ./sample/images
```

---

## 注意事項

- SVGファイルは変換せずそのままコピーされます
- アスペクト比は常に維持されます
- 元画像より小さいサイズにリサイズする場合のみ縮小されます
