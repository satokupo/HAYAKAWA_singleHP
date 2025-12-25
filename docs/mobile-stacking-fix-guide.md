# モバイル版スタッキング修正指示書

## 現状

- PC版: スタッキングカード効果が正常に動作
- モバイル版（900px以下）: スタッキングが動作せず、すべてのカードが分離して隙間がある状態
- 開発者ツールで確認: `.stack-block` に `position: sticky` は正しく適用されている

## やりたいこと

モバイル版でもPC版と同様に、スクロール時にカードが重なるスタッキング効果を有効にする。

## 失敗する原因（推測）

`.main` 要素に設定されている `container-type: inline-size`（行171）が原因と推測。

~~~yaml
技術的背景:
  container-typeの副作用: |
    container-type を設定すると、その要素に CSS Containment が適用される。
    具体的には contain: inline-size layout style が暗黙的に適用される。
    
  layout containmentの影響: |
    layout containment は要素を「独立したフォーマットコンテキスト」にする。
    これにより position: sticky の参照先（スクロールコンテナ）が
    ページ全体ではなく .main 内部に限定される可能性がある。
    
  PC版で動作する理由: |
    PC版では .main 自体がスクロール領域を持つため問題が顕在化しない。
    モバイル版では .wrapper が column レイアウトになり、
    ページ全体でスクロールするため、参照先のズレが問題になる。
~~~

## 具体的な対応方法

### 手順1: container-type をモバイル版で無効化

`@media (max-width: 900px)` 内に以下を追加：

```css
@media (max-width: 900px) {
    .main {
        container-type: normal;
    }
    /* 既存のルールはそのまま維持 */
}
```

### 手順2: @container クエリを @media クエリに変換

`container-type: normal` にすると、既存の `@container` クエリが動作しなくなる。
以下の2箇所を `@media` クエリに書き換える必要がある。

#### 変換対象1: メニューグリッド（行525-542付近）

変換前:
```css
@container main-content (max-width: 500px) {
    .menu-grid {
        grid-template-columns: 1fr;
    }
    .owner-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .owner-photo {
        max-width: 150px;
    }
}
```

変換後:
```css
@media (max-width: 600px) {
    .menu-grid {
        grid-template-columns: 1fr;
    }
    .owner-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .owner-photo {
        max-width: 150px;
    }
}
```

※ブレークポイントは `.main` の幅 + padding を考慮して調整（500px → 約600px目安）

#### 変換対象2: アクセスセクション（行544-555付近）

変換前:
```css
@container main-content (max-width: 700px) {
    .access-container {
        flex-direction: column;
    }
    .access-embed {
        min-height: 250px;
    }
}
```

変換後:
```css
@media (max-width: 800px) {
    .access-container {
        flex-direction: column;
    }
    .access-embed {
        min-height: 250px;
    }
}
```

※ブレークポイントは 700px → 約800px目安

### 手順3: 検証

1. モバイル表示（900px以下）でスタッキングが動作するか確認
2. 各ブレークポイントでレイアウト崩れがないか確認
3. PC版が影響を受けていないか確認

## 検証手順（原因特定のため）

もし上記の修正でスタッキングが動作しない場合、原因は別にある。
その場合は以下を追加で確認：

~~~yaml
確認項目:
  - .main の親要素（.wrapper）の overflow 計算値
  - .main 自体の overflow 計算値
  - body, html の overflow 設定
  - sticky要素の高さと親要素の高さの関係
~~~

## 補足: 変更しないこと

- `overflow-x: hidden`（.wrapper）は変更しない
  - 横スクロール防止の意図があり、削除すると別の問題が発生する可能性
  - stickyへの影響は overflow-y に依存し、現状 overflow-y は指定なし（visible）

## ファイル編集箇所まとめ

~~~yaml
対象ファイル: index.html

変更箇所:
  1:
    行番号: 558付近（@media max-width: 900px 内）
    内容: ".main { container-type: normal; }" を追加
    
  2:
    行番号: 524-542付近
    内容: "@container main-content (max-width: 500px)" を "@media (max-width: 600px)" に変更
    
  3:
    行番号: 544-555付近
    内容: "@container main-content (max-width: 700px)" を "@media (max-width: 800px)" に変更
~~~
