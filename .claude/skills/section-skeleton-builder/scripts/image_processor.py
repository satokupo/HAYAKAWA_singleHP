#!/usr/bin/env python3
"""
画像リサイズ・変換スクリプト

用途: 既存画像のリサイズ、WebP変換、リネームを一括処理
- アスペクト比を維持してリサイズ
- JPG/PNGをWebPに変換
- ファイル名の変更（リネーム）
- SVGはそのままコピー（変換しない）

使用例:
    # 基本的な使い方（最大幅1200px、WebP変換）
    python image_processor.py --input ./raw_images --output ./images

    # 最大サイズを指定
    python image_processor.py --input ./raw_images --output ./images --max-width 800 --max-height 600

    # WebPに変換せず元の形式を維持
    python image_processor.py --input ./raw_images --output ./images --keep-format

    # 品質を指定
    python image_processor.py --input ./raw_images --output ./images --quality 90

    # JSON設定ファイルでリネーム処理
    python image_processor.py --config images.json --input ./raw_images --output ./images
"""

import argparse
import json
import shutil
from pathlib import Path
from typing import Optional

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


# 処理対象の画像拡張子
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"}
# 変換せずそのままコピーする拡張子
COPY_EXTENSIONS = {".svg", ".ico"}


def get_image_info(image_path: Path) -> dict:
    """画像の情報を取得"""
    if not PIL_AVAILABLE:
        return {"error": "Pillowがインストールされていません"}
    
    try:
        with Image.open(image_path) as img:
            return {
                "width": img.width,
                "height": img.height,
                "format": img.format,
                "mode": img.mode,
            }
    except Exception as e:
        return {"error": str(e)}


def resize_image(
    img: Image.Image,
    max_width: Optional[int],
    max_height: Optional[int]
) -> Image.Image:
    """アスペクト比を維持してリサイズ"""
    
    original_width, original_height = img.size
    
    # リサイズが不要な場合
    if max_width is None and max_height is None:
        return img
    
    # 現在のサイズが制限以下なら何もしない
    width_ok = max_width is None or original_width <= max_width
    height_ok = max_height is None or original_height <= max_height
    
    if width_ok and height_ok:
        return img
    
    # アスペクト比を計算
    aspect_ratio = original_width / original_height
    
    # 新しいサイズを計算
    new_width = original_width
    new_height = original_height
    
    if max_width and original_width > max_width:
        new_width = max_width
        new_height = int(max_width / aspect_ratio)
    
    if max_height and new_height > max_height:
        new_height = max_height
        new_width = int(max_height * aspect_ratio)
    
    # リサイズ実行
    return img.resize((new_width, new_height), Image.Resampling.LANCZOS)


def process_image(
    input_path: Path,
    output_path: Path,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    convert_to_webp: bool = True,
    quality: int = 85
) -> dict:
    """
    単一画像を処理
    
    Returns:
        処理結果の辞書
    """
    result = {
        "input": str(input_path),
        "output": str(output_path),
        "success": False,
        "action": [],
    }
    
    suffix = input_path.suffix.lower()
    
    # SVGなどはそのままコピー
    if suffix in COPY_EXTENSIONS:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(input_path, output_path)
        result["success"] = True
        result["action"].append("コピー（変換なし）")
        return result
    
    # 画像ファイルでなければスキップ
    if suffix not in IMAGE_EXTENSIONS:
        result["action"].append("スキップ（非対応形式）")
        return result
    
    if not PIL_AVAILABLE:
        result["action"].append("エラー: Pillowがインストールされていません")
        return result
    
    try:
        with Image.open(input_path) as img:
            original_size = img.size
            
            # RGBAモードの場合、WebP変換時に対応
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                # アルファチャンネルを持つ画像はそのまま処理
                pass
            elif img.mode != "RGB":
                img = img.convert("RGB")
                result["action"].append("RGB変換")
            
            # リサイズ
            resized_img = resize_image(img, max_width, max_height)
            new_size = resized_img.size
            
            if original_size != new_size:
                result["action"].append(f"リサイズ: {original_size[0]}x{original_size[1]} → {new_size[0]}x{new_size[1]}")
            
            # 出力パスを決定
            if convert_to_webp and suffix != ".webp":
                output_path = output_path.with_suffix(".webp")
                result["output"] = str(output_path)
                result["action"].append("WebP変換")
            
            # 出力ディレクトリ作成
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 保存
            output_suffix = output_path.suffix.lower()
            
            if output_suffix == ".webp":
                # アルファチャンネルがある場合
                if resized_img.mode in ("RGBA", "LA"):
                    resized_img.save(output_path, "WEBP", quality=quality, lossless=False)
                else:
                    resized_img.save(output_path, "WEBP", quality=quality)
            elif output_suffix in (".jpg", ".jpeg"):
                # JPEGはアルファチャンネルをサポートしないのでRGBに変換
                if resized_img.mode in ("RGBA", "LA"):
                    resized_img = resized_img.convert("RGB")
                resized_img.save(output_path, "JPEG", quality=quality)
            elif output_suffix == ".png":
                resized_img.save(output_path, "PNG", optimize=True)
            else:
                resized_img.save(output_path)
            
            result["success"] = True
            
            if not result["action"]:
                result["action"].append("処理なし（変更不要）")
    
    except Exception as e:
        result["action"].append(f"エラー: {e}")
    
    return result


def process_directory(
    input_dir: Path,
    output_dir: Path,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    convert_to_webp: bool = True,
    quality: int = 85,
    recursive: bool = True,
    flatten: bool = False
) -> list[dict]:
    """
    ディレクトリ内の画像を一括処理
    
    Args:
        input_dir: 入力ディレクトリ
        output_dir: 出力ディレクトリ
        max_width: 最大幅
        max_height: 最大高さ
        convert_to_webp: WebPに変換するか
        quality: 画像品質
        recursive: サブディレクトリも処理するか
        flatten: 出力をフラットにするか（サブディレクトリ構造を維持しない）
    """
    results = []
    
    # 画像ファイルを収集
    all_extensions = IMAGE_EXTENSIONS | COPY_EXTENSIONS
    
    if recursive:
        files = [f for f in input_dir.rglob("*") if f.suffix.lower() in all_extensions]
    else:
        files = [f for f in input_dir.glob("*") if f.suffix.lower() in all_extensions]
    
    for input_path in sorted(files):
        # 出力パスを決定
        if flatten:
            output_path = output_dir / input_path.name
        else:
            relative_path = input_path.relative_to(input_dir)
            output_path = output_dir / relative_path
        
        result = process_image(
            input_path,
            output_path,
            max_width,
            max_height,
            convert_to_webp,
            quality
        )
        results.append(result)
    
    return results


def process_config_file(
    config_path: Path,
    input_dir: Path,
    output_dir: Path
) -> list[dict]:
    """
    JSON設定ファイルから画像を処理（リネーム対応）

    JSON形式:
    {
      "images": [
        {"input": "photo001.jpg", "output": "hero.webp", "max_width": 1200},
        {"input": "photo002.png", "output": "about-bg.webp"}
      ],
      "default": {
        "max_width": 1200,
        "max_height": null,
        "quality": 85,
        "convert_to_webp": true
      }
    }
    """
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # デフォルト設定
    defaults = config.get("default", {})
    default_max_width = defaults.get("max_width", 1200)
    default_max_height = defaults.get("max_height", None)
    default_quality = defaults.get("quality", 85)
    default_convert = defaults.get("convert_to_webp", True)

    # 画像リスト取得
    images = config.get("images", [])

    results = []

    for item in images:
        input_name = item.get("input")
        output_name = item.get("output", input_name)

        if not input_name:
            results.append({
                "input": "不明",
                "output": "不明",
                "success": False,
                "action": ["エラー: inputが指定されていません"]
            })
            continue

        input_path = input_dir / input_name

        if not input_path.exists():
            results.append({
                "input": str(input_path),
                "output": str(output_dir / output_name),
                "success": False,
                "action": [f"エラー: ファイルが見つかりません"]
            })
            continue

        output_path = output_dir / output_name

        # 個別設定またはデフォルト設定を使用
        max_width = item.get("max_width", default_max_width)
        max_height = item.get("max_height", default_max_height)
        quality = item.get("quality", default_quality)
        convert_to_webp = item.get("convert_to_webp", default_convert)

        result = process_image(
            input_path,
            output_path,
            max_width,
            max_height,
            convert_to_webp,
            quality
        )

        # リネームされた場合はアクションに追加
        if input_name != output_name:
            result["action"].insert(0, f"リネーム: {input_name} → {output_name}")

        results.append(result)

    return results


def print_results(results: list[dict]) -> None:
    """処理結果を表示"""
    success_count = 0
    skip_count = 0
    error_count = 0
    
    for result in results:
        input_name = Path(result["input"]).name
        output_name = Path(result["output"]).name
        actions = ", ".join(result["action"])
        
        if result["success"]:
            success_count += 1
            if input_name != output_name:
                print(f"✓ {input_name} → {output_name} ({actions})")
            else:
                print(f"✓ {input_name} ({actions})")
        elif "スキップ" in actions:
            skip_count += 1
            print(f"- {input_name} ({actions})")
        else:
            error_count += 1
            print(f"✗ {input_name} ({actions})")
    
    print(f"\n完了: 成功 {success_count}件, スキップ {skip_count}件, エラー {error_count}件")


def main():
    parser = argparse.ArgumentParser(
        description="画像のリサイズ・WebP変換・リネームを一括処理",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  # 基本的な使い方（最大幅1200px、WebP変換）
  python image_processor.py --input ./raw_images --output ./images

  # 最大サイズを指定
  python image_processor.py -i ./raw -o ./images --max-width 800 --max-height 600

  # WebPに変換せず元の形式を維持
  python image_processor.py -i ./raw -o ./images --keep-format

  # 品質を指定（デフォルト: 85）
  python image_processor.py -i ./raw -o ./images --quality 90

  # サブディレクトリ構造をフラットにして出力
  python image_processor.py -i ./raw -o ./images --flatten

  # JSON設定ファイルでリネーム処理
  python image_processor.py --config images.json -i ./raw -o ./images

JSON設定ファイル形式:
  {
    "images": [
      {"input": "photo001.jpg", "output": "hero.webp"},
      {"input": "photo002.png", "output": "about-bg.webp", "max_width": 800}
    ],
    "default": {"max_width": 1200, "quality": 85}
  }
        """
    )

    parser.add_argument("--input", "-i", type=Path, help="入力ディレクトリ")
    parser.add_argument("--output", "-o", type=Path, help="出力ディレクトリ")
    parser.add_argument("--config", "-c", type=Path, help="JSON設定ファイル（リネーム対応）")
    parser.add_argument("--max-width", "-W", type=int, default=1200, help="最大幅（デフォルト: 1200）")
    parser.add_argument("--max-height", "-H", type=int, default=None, help="最大高さ（デフォルト: 制限なし）")
    parser.add_argument("--quality", "-q", type=int, default=85, help="画像品質 1-100（デフォルト: 85）")
    parser.add_argument("--keep-format", "-k", action="store_true", help="WebPに変換せず元の形式を維持")
    parser.add_argument("--no-recursive", "-nr", action="store_true", help="サブディレクトリを処理しない")
    parser.add_argument("--flatten", "-f", action="store_true", help="出力をフラットにする")
    parser.add_argument("--info", type=Path, help="指定した画像の情報を表示して終了")
    
    args = parser.parse_args()
    
    # 画像情報表示モード
    if args.info:
        info = get_image_info(args.info)
        if "error" in info:
            print(f"エラー: {info['error']}")
            return 1
        print(f"ファイル: {args.info}")
        print(f"サイズ: {info['width']} x {info['height']}")
        print(f"形式: {info['format']}")
        print(f"モード: {info['mode']}")
        return 0

    # 必須引数チェック
    if not args.input or not args.output:
        print("エラー: --input と --output は必須です")
        parser.print_help()
        return 1

    # 入力ディレクトリ確認
    if not args.input.exists():
        print(f"エラー: 入力ディレクトリが見つかりません: {args.input}")
        return 1

    if not args.input.is_dir():
        print(f"エラー: 入力パスがディレクトリではありません: {args.input}")
        return 1

    # JSON設定ファイルモード
    if args.config:
        if not args.config.exists():
            print(f"エラー: 設定ファイルが見つかりません: {args.config}")
            return 1

        print(f"設定ファイル: {args.config}")
        print(f"入力: {args.input}")
        print(f"出力: {args.output}")
        print("-" * 40)

        results = process_config_file(args.config, args.input, args.output)
        print_results(results)
        return 0

    # 通常モード（ディレクトリ一括処理）
    print(f"入力: {args.input}")
    print(f"出力: {args.output}")
    print(f"最大サイズ: {args.max_width or '制限なし'} x {args.max_height or '制限なし'}")
    print(f"WebP変換: {'しない' if args.keep_format else 'する'}")
    print(f"品質: {args.quality}")
    print("-" * 40)

    results = process_directory(
        args.input,
        args.output,
        max_width=args.max_width,
        max_height=args.max_height,
        convert_to_webp=not args.keep_format,
        quality=args.quality,
        recursive=not args.no_recursive,
        flatten=args.flatten
    )

    print_results(results)

    return 0


if __name__ == "__main__":
    exit(main())
