# astro-lint

Astroプロジェクトの型チェック（`astro check`）を実行し、TypeScriptエラーを検出するスキル。

## トリガー

- 「Astro lint」「astro check」「型チェック」「TypeScriptエラー確認」
- 「リンターエラー確認」「Astroのエラー確認」

## 処理フロー

1. `setup.py`を実行
2. リポジトリ内の`astro.config.*`を探してAstroプロジェクトを自動検出
3. 各プロジェクトで`@astrojs/check`がなければインストール
4. `npx astro check`を実行してエラー一覧を取得
5. 結果をまとめて報告

## 使用方法

```bash
.venv/Scripts/python.exe .claude/skills/astro-lint/setup.py
# または
python .claude/skills/astro-lint/setup.py
```

## 出力

- 各Astroプロジェクトのエラー一覧
- エラーがなければ「0 errors」と表示

## 修正について

このスキルは**検出のみ**を行う。
エラーの修正はメインコンテキストで実施すること。
