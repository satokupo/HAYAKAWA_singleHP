#!/usr/bin/env python3
"""
プレースホルダー画像生成スクリプト

用途: HP制作時の仮画像を一括生成
出力形式: WebP（推奨）、PNG、SVG

使用例:
    # JSONファイルから生成
    python placeholder_generator.py --config images.json --output ./images

    # コマンドラインで直接指定
    python placeholder_generator.py --size 600x400 --name hero.webp --output ./images

    # 複数画像を一括生成
    python placeholder_generator.py --batch "hero:600x400,menu-1:300x300,gallery-1:400x300" --output ./images
"""

import argparse
import json
from pathlib import Path
from typing import Optional

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def get_font(size: int = 24) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """利用可能なフォントを取得"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
    ]
    
    for font_path in font_paths:
        try:
            return ImageFont.truetype(font_path, size)
        except (IOError, OSError):
            continue
    
    return ImageFont.load_default()


def generate_placeholder_image(
    width: int,
    height: int,
    output_path: Path,
    bg_color: str = "#CCCCCC",
    text_color: str = "#666666",
    show_filename: bool = True
) -> bool:
    """
    プレースホルダー画像を生成
    
    Args:
        width: 画像幅
        height: 画像高さ
        output_path: 出力ファイルパス
        bg_color: 背景色（hex）
        text_color: テキスト色（hex）
        show_filename: ファイル名を表示するか
    
    Returns:
        成功したかどうか
    """
    if not PIL_AVAILABLE:
        print("エラー: Pillowがインストールされていません")
        print("  pip install Pillow --break-system-packages")
        return False
    
    # 画像作成
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # サイズテキスト
    size_text = f"{width} × {height}"
    
    # フォントサイズを画像サイズに応じて調整
    font_size = min(width, height) // 8
    font_size = max(16, min(font_size, 48))
    font = get_font(font_size)
    
    # テキスト描画位置を計算
    bbox = draw.textbbox((0, 0), size_text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # ファイル名も表示する場合は位置調整
    if show_filename:
        y -= font_size // 2
    
    draw.text((x, y), size_text, fill=text_color, font=font)
    
    # ファイル名表示
    if show_filename:
        filename = output_path.name
        small_font = get_font(font_size // 2)
        bbox = draw.textbbox((0, 0), filename, font=small_font)
        fn_width = bbox[2] - bbox[0]
        fn_x = (width - fn_width) // 2
        fn_y = y + text_height + 10
        draw.text((fn_x, fn_y), filename, fill=text_color, font=small_font)
    
    # 枠線（オプション）
    border_color = "#AAAAAA"
    draw.rectangle([0, 0, width - 1, height - 1], outline=border_color, width=2)
    
    # 保存
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    suffix = output_path.suffix.lower()
    if suffix == ".webp":
        img.save(output_path, "WEBP", quality=80)
    elif suffix == ".png":
        img.save(output_path, "PNG")
    elif suffix in [".jpg", ".jpeg"]:
        img.save(output_path, "JPEG", quality=85)
    else:
        # デフォルトはWebP
        output_path = output_path.with_suffix(".webp")
        img.save(output_path, "WEBP", quality=80)
    
    return True


def generate_svg_placeholder(
    width: int,
    height: int,
    output_path: Path,
    bg_color: str = "#CCCCCC",
    text_color: str = "#666666"
) -> bool:
    """SVG形式のプレースホルダーを生成"""
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="{bg_color}"/>
  <rect x="1" y="1" width="{width-2}" height="{height-2}" fill="none" stroke="#AAAAAA" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="{min(width, height) // 8}" fill="{text_color}">{width} × {height}</text>
  <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="{min(width, height) // 16}" fill="{text_color}">{output_path.name}</text>
</svg>'''
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(svg_content, encoding="utf-8")
    return True


def generate_placeholder(
    width: int,
    height: int,
    output_path: Path,
    bg_color: str = "#CCCCCC",
    text_color: str = "#666666"
) -> bool:
    """形式に応じてプレースホルダーを生成"""
    
    suffix = output_path.suffix.lower()
    
    if suffix == ".svg":
        return generate_svg_placeholder(width, height, output_path, bg_color, text_color)
    else:
        return generate_placeholder_image(width, height, output_path, bg_color, text_color)


def parse_size(size_str: str) -> tuple[int, int]:
    """サイズ文字列をパース（例: "600x400" → (600, 400)）"""
    parts = size_str.lower().split("x")
    if len(parts) != 2:
        raise ValueError(f"無効なサイズ形式: {size_str}（例: 600x400）")
    return int(parts[0]), int(parts[1])


def process_config_file(config_path: Path, output_dir: Path) -> int:
    """JSONコンフィグファイルから画像を生成"""
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    images = config.get("images", config if isinstance(config, list) else [])
    
    success_count = 0
    for item in images:
        name = item.get("name", f"placeholder-{item['width']}x{item['height']}.webp")
        width = item.get("width", 300)
        height = item.get("height", 200)
        
        output_path = output_dir / name
        
        if generate_placeholder(width, height, output_path):
            print(f"✓ 生成: {output_path}")
            success_count += 1
        else:
            print(f"✗ 失敗: {output_path}")
    
    return success_count


def process_batch(batch_str: str, output_dir: Path, ext: str = ".webp") -> int:
    """バッチ文字列から画像を生成（例: "hero:600x400,menu:300x300"）"""
    
    success_count = 0
    items = batch_str.split(",")
    
    for item in items:
        item = item.strip()
        if ":" in item:
            name, size = item.split(":", 1)
        else:
            name = f"placeholder-{item}"
            size = item
        
        try:
            width, height = parse_size(size)
        except ValueError as e:
            print(f"✗ スキップ: {item} - {e}")
            continue
        
        # 拡張子がなければ追加
        if not Path(name).suffix:
            name = f"{name}{ext}"
        
        output_path = output_dir / name
        
        if generate_placeholder(width, height, output_path):
            print(f"✓ 生成: {output_path}")
            success_count += 1
        else:
            print(f"✗ 失敗: {output_path}")
    
    return success_count


def main():
    parser = argparse.ArgumentParser(
        description="プレースホルダー画像を生成",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # JSONファイルから生成
  python placeholder_generator.py --config images.json --output ./images

  # 単一画像を生成
  python placeholder_generator.py --size 600x400 --name hero.webp --output ./images

  # 複数画像を一括生成
  python placeholder_generator.py --batch "hero:600x400,menu-1:300x300" --output ./images

JSONファイル形式:
  {
    "images": [
      {"name": "hero.webp", "width": 600, "height": 400},
      {"name": "menu-1.webp", "width": 300, "height": 300}
    ]
  }
        """
    )
    
    parser.add_argument("--config", "-c", type=Path, help="JSONコンフィグファイル")
    parser.add_argument("--output", "-o", type=Path, default=Path("./images"), help="出力ディレクトリ")
    parser.add_argument("--size", "-s", type=str, help="画像サイズ（例: 600x400）")
    parser.add_argument("--name", "-n", type=str, help="出力ファイル名")
    parser.add_argument("--batch", "-b", type=str, help="バッチ生成（例: hero:600x400,menu:300x300）")
    parser.add_argument("--ext", "-e", type=str, default=".webp", help="デフォルト拡張子")
    
    args = parser.parse_args()
    
    # 出力ディレクトリ作成
    args.output.mkdir(parents=True, exist_ok=True)
    
    total = 0
    
    # JSONコンフィグから生成
    if args.config:
        if not args.config.exists():
            print(f"エラー: コンフィグファイルが見つかりません: {args.config}")
            return 1
        total += process_config_file(args.config, args.output)
    
    # バッチ生成
    if args.batch:
        total += process_batch(args.batch, args.output, args.ext)
    
    # 単一画像生成
    if args.size:
        try:
            width, height = parse_size(args.size)
        except ValueError as e:
            print(f"エラー: {e}")
            return 1
        
        name = args.name or f"placeholder-{width}x{height}{args.ext}"
        output_path = args.output / name
        
        if generate_placeholder(width, height, output_path):
            print(f"✓ 生成: {output_path}")
            total += 1
        else:
            print(f"✗ 失敗: {output_path}")
    
    if total == 0 and not (args.config or args.batch or args.size):
        parser.print_help()
        return 1
    
    print(f"\n合計: {total}件の画像を生成しました")
    return 0


if __name__ == "__main__":
    exit(main())
