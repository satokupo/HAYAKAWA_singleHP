---
name: section-skeleton-builder
description: |
  セクションのサンプル画像を解析してHTMLスケルトンを構築するスキル。
  ユーザーが「セクションを作りたい」「新しいセクションを追加」と言った時、
  またはセクションのサンプル画像・デザインカンプを提供した時に発火。
  プランモード中は提案のみ、通常モードでは実装まで行う。
user-invocable: false
---

# セクション骨組み作成スキル

サンプル画像からHTMLセクションのスケルトン（ワイヤーフレーム）を構築する。

---

## トリガー条件

以下の場合にこのスキルを使用する：
- ユーザーが「セクションを作りたい」「新しいセクションを追加」と言った
- セクションのサンプル画像・デザインカンプが提供された
- 「このデザインをHTMLにして」と依頼された

---

## 処理フロー

### フェーズ1: 提案（プランモード中または確認が必要な場合）

1. **画像解析**
   - サンプル画像を解析し、レイアウト構造を把握
   - 必要な要素を特定（見出し、画像、テキスト、ボタン等）

2. **プラン提案**
   - セクションの構造を提案
   - 必要なプレースホルダー画像のリストを作成
   - 画像サイズ・ファイル名を提案

3. **ユーザー確認**
   - 「この構造で作成しますか？」と確認
   - 画像リストを提示し、修正があれば反映

### フェーズ2: 実装（承認後または通常モード）

4. **画像生成**
   - Pythonスクリプトでプレースホルダー画像を生成
   - スクリプト: `.claude/skills/section-skeleton-builder/scripts/placeholder_generator.py`

5. **HTML構築**
   - セクションのHTMLを作成
   - 既存のコーディング規約に従う

6. **統合**
   - index.htmlへの統合方法を案内

---

## 画像生成コマンド

### プレースホルダー画像生成

```bash
# 仮想環境のPythonを使用
.venv/Scripts/python.exe .claude/skills/section-skeleton-builder/scripts/placeholder_generator.py \
  --batch "hero:750x1334,menu-1:300x300,gallery-1:600x400" \
  --output ./sample/images
```

### バッチ形式
```
名前:幅x高さ,名前:幅x高さ,...
```

---

## HTML構造の規約

### セクションの基本構造
```html
<section class="section-XX" id="section-XX">
  <div class="section-XX__inner">
    <!-- コンテンツ -->
  </div>
</section>
```

### 命名規則
- セクション: `section-XX`（XXは2桁の連番）
- 内部要素: `section-XX__要素名`（BEM記法）
- 画像: 小文字英数字、ハイフン区切り

### 画像の属性
```html
<img
  src="images/画像名.webp"
  alt="説明"
  width="幅"
  height="高さ"
  loading="lazy"
>
```
- width/height属性は必須（CLS防止）
- ファーストビュー以外は `loading="lazy"`

---

## CSSの規約

### 配置
- Tailwind CSS（CDN）を優先
- Tailwindで対応できない場合のみカスタムCSS
- カスタムCSSは `<style>` タグ内、BEM記法

### レスポンシブ
- モバイルファースト
- 最小幅: 375px
- 開発時max-width: 390px

---

## 確認項目

セクション作成後に確認：
- [ ] HTML構造が既存セクションと統一されている
- [ ] 画像にwidth/height属性がある
- [ ] BEM記法で命名されている
- [ ] モバイル表示で崩れていない
