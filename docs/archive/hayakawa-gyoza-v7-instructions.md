# HAYAKAWA餃子 HP 修正指示書 v7

## 概要

~~~yaml
目的: v6で行った「section-header分離」を元に戻す（リセット）

理由:
  - v6の変更により構造が複雑化
  - 視覚的な分離が発生
  - 指示内容が破綻しているためリセット

方針:
  - HTML: section-header を削除し、タイトルを stack-block 内に戻す
  - CSS: .section-header 関連のスタイルを削除
  - JS: headers 関連の処理を削除し、元のシンプルな計算に戻す

対象: PC版のみ
~~~

---

## 変更1: menuセクションのHTML変更

### 現状（v6適用後）

```html
<section id="menu" aria-label="メニュー">
    <div class="section-header" data-group="menu" data-role="header">
        <div class="card-header">
            <span class="card-label">01 / Menu</span>
        </div>
        <h2>メニュー</h2>
    </div>
    <div class="stack-block" data-group="menu" data-index="0">
        <div class="card-body">
            <div class="menu-grid" data-menu-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="menu" data-index="1">
        <div class="card-body">
            <div class="menu-grid" data-menu-block="1"></div>
            <p class="menu-note">テイクアウトもできます</p>
        </div>
    </div>
</section>
```

### 変更後（元に戻す）

```html
<section id="menu" aria-label="メニュー">
    <div class="stack-block" data-group="menu" data-index="0">
        <div class="card-header">
            <span class="card-label">01 / Menu</span>
        </div>
        <div class="card-body">
            <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">メニュー</h2>
            <div class="menu-grid" data-menu-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="menu" data-index="1">
        <div class="card-body">
            <div class="menu-grid" data-menu-block="1"></div>
            <p class="menu-note">テイクアウトもできます</p>
        </div>
    </div>
</section>
```

### 変更ポイント

- `.section-header` を削除
- `card-header` と `h2` を `data-index="0"` の `.stack-block` 内に移動
- `h2` にインラインスタイルを戻す

---

## 変更2: interiorセクションのHTML変更

### 現状（v6適用後）

```html
<section id="interior" aria-label="店内雰囲気">
    <div class="section-header" data-group="interior" data-role="header">
        <div class="card-header">
            <span class="card-label">02 / Interior</span>
        </div>
        <h2>店内</h2>
    </div>
    <div class="stack-block" data-group="interior" data-index="0">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="1">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="1"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="2">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="2"></div>
        </div>
    </div>
</section>
```

### 変更後（元に戻す）

```html
<section id="interior" aria-label="店内雰囲気">
    <div class="stack-block" data-group="interior" data-index="0">
        <div class="card-header">
            <span class="card-label">02 / Interior</span>
        </div>
        <div class="card-body">
            <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">店内</h2>
            <div class="interior-gallery" data-interior-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="1">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="1"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="2">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="2"></div>
        </div>
    </div>
</section>
```

### 変更ポイント

- `.section-header` を削除
- `card-header` と `h2` を `data-index="0"` の `.stack-block` 内に移動
- `h2` にインラインスタイルを戻す

---

## 変更3: CSSから .section-header 関連を削除

### 削除対象

以下のCSS定義を全て削除：

```css
/* セクションヘッダー（スタッキング対象外） */
.section-header {
    background: var(--bg-section);
    padding: 5rem;
    padding-bottom: 2rem;
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    position: sticky;
    z-index: var(--z-sticky);
    /* top は JS で設定 */
}

.section-header .card-header {
    margin-bottom: 1.5rem;
}

.section-header h2 {
    font-size: 1.5rem;
    margin: 0;
}
```

### スマホ版メディアクエリ内も削除

```css
/* section-header: スタッキング維持 */
.section-header {
    padding: 2rem;
    padding-bottom: 1rem;
    /* top, position はJSで設定されるため !important なし */
}
```

---

## 変更4: .stack-block のCSS調整

### 現状

```css
.stack-block {
    background: var(--bg-section);
    padding: 5rem;
    padding-top: 3rem; /* タイトル分離により上部余白を調整 */
    margin-bottom: 4rem;
    min-height: 60vh; /* 80vh → 60vh に変更 */
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    position: sticky;
    border-top: 1px solid #eee;
    /* top と z-index は JS で動的に設定 */
}
```

### 変更後（元に戻す）

```css
.stack-block {
    background: var(--bg-section);
    padding: 5rem;
    margin-bottom: 4rem;
    min-height: 80vh; /* 元に戻す */
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    position: sticky;
    border-top: 1px solid #eee;
    /* top と z-index は JS で動的に設定 */
}
```

### 変更ポイント

- `padding-top: 3rem;` を削除（padding: 5rem に統一）
- `min-height: 60vh` → `min-height: 80vh` に戻す

---

## 変更5: JSのスタッキング計算を元に戻す

### 現状（v6適用後）

```javascript
// ----- スタッキング位置の計算 -----
const headers = document.querySelectorAll('.section-header');
const blocks = document.querySelectorAll('.stack-block');
const baseTop = 32;      // 初期top値（px）= 2rem相当
const groupOffset = 16;  // グループ間のズレ幅（px）= 1rem相当

let currentTop = baseTop;
let currentZIndex = 2;   // heroが1なので2から開始

// グループごとのヘッダー高さを記録
const headerHeights = {};

// 1. section-header の位置設定と高さ取得
headers.forEach((header) => {
    const group = header.dataset.group;
    currentTop += groupOffset;

    header.style.top = `${currentTop}px`;
    header.style.zIndex = currentZIndex;
    currentZIndex++;

    // ヘッダーの高さを記録
    headerHeights[group] = header.offsetHeight;
});

// 2. stack-block の位置設定（ヘッダー高さを考慮）
let lastGroup = null;

blocks.forEach((block) => {
    const group = block.dataset.group;
    const indexInGroup = parseInt(block.dataset.index, 10);

    // 新しいグループの開始時
    if (group !== lastGroup) {
        // ヘッダーがあるグループの場合、ヘッダー高さ分を加算
        if (headerHeights[group]) {
            currentTop += groupOffset + headerHeights[group];
        } else {
            // ヘッダーがないグループ（owner, access）
            currentTop += groupOffset;
        }
        lastGroup = group;
    }
    // グループ内の2番目以降 → currentTopはそのまま

    block.style.top = `${currentTop}px`;
    block.style.zIndex = currentZIndex;

    currentZIndex++;
});
```

### 変更後（元に戻す）

```javascript
// ----- スタッキング位置の計算 -----
const blocks = document.querySelectorAll('.stack-block');
const baseTop = 32;      // 初期top値（px）= 2rem相当
const groupOffset = 16;  // グループ間のズレ幅（px）= 1rem相当

let currentTop = baseTop;
let currentZIndex = 2;   // heroが1なので2から開始

blocks.forEach((block) => {
    const indexInGroup = parseInt(block.dataset.index, 10);

    if (indexInGroup === 0) {
        // グループの先頭ブロック → ズレを加算
        currentTop += groupOffset;
    }
    // グループ内の2番目以降 → currentTopはそのまま

    block.style.top = `${currentTop}px`;
    block.style.zIndex = currentZIndex;

    currentZIndex++;
});
```

### 変更ポイント

- `headers` 関連の処理を全て削除
- `headerHeights` 変数を削除
- `lastGroup` 変数を削除
- 元のシンプルなループに戻す

---

## 確認用チェックリスト

~~~yaml
PC版:
  - [ ] menuセクション: タイトルとコンテンツが1つのカードにまとまっているか
  - [ ] interiorセクション: 同様にまとまっているか
  - [ ] 各セクションのスタッキングが正常に動作するか
  - [ ] ownerセクション: 従来通りの動作か
  - [ ] accessセクション: 従来通りの動作か
  - [ ] 画像が正常に表示されるか（v6で解決済み）
~~~

---

## 補足

~~~yaml
この変更後の状態:
  - v6適用前の状態に戻る
  - タイトルがスタッキング時に隠れる問題は「再発」する
  - 画像フォールバック機能は維持される

次のステップ:
  - この状態を確認後、改めて「タイトルが隠れる問題」に対処
  - 別のアプローチを検討する
~~~
