# Claude Code プロジェクト設定

---

## 基本設定

### 文字コード
- 指示がない限り UTF-8 を明示的に利用すること

### 保存場所の優先順位
1. **最優先**: ユーザーがチャットで明確に指示した場所
2. **2番目**: 提供された指示書・要件定義書内に記載された保存場所
3. **3番目**: 提供された指示書・要件定義書と同じ階層
4. **最後**: プロジェクトルート/_doc/_temp/ の中

---

## Python環境について
**このプロジェクトは仮想環境を使用します。グローバルの Python は使わず、仮想環境内で全て処理してください。**

### 基本ルール
- **Python実行**: `.venv/Scripts/python.exe` を使用
- **ライブラリインストール**: `.venv/Scripts/pip.exe` を使用
- システムの `python` や `pip` コマンドは使用禁止

### 実行例
```bash
# Python実行
.venv/Scripts/python.exe _doc/helper/script_name.py

# ライブラリインストール
.venv/Scripts/pip.exe install pillow
```

### requirements.txt（ライブラリ管理ファイル）

プロジェクトで使用するライブラリのリストを管理するファイルです。

```bash
# ライブラリ一覧を出力（現在の環境をバックアップ）
.venv/Scripts/pip.exe freeze > requirements.txt

# ライブラリ一覧から一括インストール（環境を復元）
.venv/Scripts/pip.exe install -r requirements.txt
```

---

## MCPルール

### 使い分け

- 分析や推論は Codex を利用（必要に応じて推論モードを切り替え。通常はデフォルトの medium を利用）
- 技術要件を定義する時は Context7 で技術スタックの最新情報を確認すること
- フロントエンドの挙動確認をする場合はユーザーに Chrome で対象ページを開いていることを確認して

### MCP経由でのファイル共有ルール

- MCP経由で AI にファイルを提供する場合は、必ず `local_fal_upload.py` を利用して FAL URL に変換すること
- ローカルパスやテキスト化したファイル内容を直接渡さないこと（コンテキスト消費や解釈エラーを防ぐため）
- 得られた認証済 URL は省略せずフルで提示すること

---

## アップロード処理

### FAL URLアップロード

注意: ローカルで完結する処理では本節の手順を使用しない（上記「ローカル処理の原則」を優先）。
**必須**: ファイルを FAL URL に変換する際は `_doc_/helper/fal_upload_helper.py` を利用すること

#### 使用方法

```bash
# ファイルをFAL URLに変換 (ファイルパス: S:/MyProjects/KAMUI_CODE/_doc_/helper/fal_upload_helper.py)
python _doc_/helper/fal_upload_helper.py [ファイルパス] 

# または実行権限付きで直接実行
./_doc_/helper/fal_upload_helper.py [ファイルパス]

# MCP連携用 (ファイルパス: S:/MyProjects/KAMUI_CODE/_doc_/helper/local_fal_upload.py)
python _doc_/helper/local_fal_upload.py [ファイルパス]

# 例：動画ファイルをアップロード 
python _doc_/helper/fal_upload_helper.py ./video.mp4 

# 例：画像ファイルをアップロード 
python _doc_/helper/fal_upload_helper.py ./image.jpg
```

#### 保存時の処理

- 保存したファイルの場所は ~ からのフルパスで表示
- 必ず得られた認証済 URL のフルパスを利用（Google Drive からの場合は長い、fal の場合は短い）。省略などしない

---

## パス・ファイル命名規則

### 共通ルール

- **1行だけのパス**: バッククォート1つで囲み、インラインコードとして提示する
  - 例:
    `S:\WP_Projects\...\_doc\helper\test.py`
- **複数行のパス**: 三連バッククォートで囲み、コードブロックとして提示する
  - 例:
    ```text
    S:\WP_Projects\...\_doc\helper\test.py
    S:\WP_Projects\...\_temp\scratch.txt
    ```
- パスの正規化（`\` → `/` 変換など）は行わず、**ユーザーが提示した表記をそのまま維持**
- JSONで渡す場合はバックスラッシュを **`\\` に二重化**して扱う
