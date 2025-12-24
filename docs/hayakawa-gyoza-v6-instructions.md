# HAYAKAWA餃子 HP 修正指示書 v6

## 概要

~~~yaml
目的:
  - セクション内スタッキングの改善（タイトル部分を常に表示）
  - 画像の拡張子フォールバック対応（WebP優先）

対象: PC版のみ（スマホ版は後日対応）

対象ファイル: index.html

採用する方法: パターンA
  - タイトルも .stack-block クラスのまま（新クラス不要）
  - ブロック分割でタイトルとコンテンツを分離
  - JSでグループ内のtop位置を計算
    - index=0（タイトル）: グループの基本top位置
    - index=1以降（コンテンツ）: 基本top + タイトル高さ

影響範囲:
  - menuセクション（構造変更）
  - interiorセクション（構造変更）
  - CSS（タイトルブロック用スタイル追加）
  - JS（スタッキング計算ロジック修正、画像読み込みロジック追加）
  - config（画像パスから拡張子を削除）

影響しない範囲:
  - ownerセクション（単一ブロックのため構造変更なし、画像読み込みのみ修正）
  - accessセクション（単一ブロックのため変更なし）
  - サイドバー
  - heroセクション（構造変更なし、画像読み込みのみ修正）
  - スマホ版メディアクエリ（今回は変更しない）
~~~

---

## 変更1: menuセクションの構造変更（HTML）

### 目的

タイトル部分（card-header + h2）をコンテンツから分離し、独立したスタッキングブロックにする。

### 現状

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

### 変更後

```html
<section id="menu" aria-label="メニュー">
    <div class="stack-block stack-block--header" data-group="menu" data-index="0">
        <div class="card-header">
            <span class="card-label">01 / Menu</span>
        </div>
        <div class="card-body">
            <h2 style="font-size: 1.5rem; margin: 0;">メニュー</h2>
        </div>
    </div>
    <div class="stack-block" data-group="menu" data-index="1">
        <div class="card-body">
            <div class="menu-grid" data-menu-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="menu" data-index="2">
        <div class="card-body">
            <div class="menu-grid" data-menu-block="1"></div>
            <p class="menu-note">テイクアウトもできます</p>
        </div>
    </div>
</section>
```

### 変更ポイント

- index=0 をタイトル専用ブロックに分離
- index=0 に `stack-block--header` モディファイアを追加
- コンテンツブロックは index=1, index=2 に変更
- data-menu-block の番号は 0, 1 のまま維持

---

## 変更2: interiorセクションの構造変更（HTML）

### 現状

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

### 変更後

```html
<section id="interior" aria-label="店内雰囲気">
    <div class="stack-block stack-block--header" data-group="interior" data-index="0">
        <div class="card-header">
            <span class="card-label">02 / Interior</span>
        </div>
        <div class="card-body">
            <h2 style="font-size: 1.5rem; margin: 0;">店内</h2>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="1">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="0"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="2">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="1"></div>
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="3">
        <div class="card-body">
            <div class="interior-gallery" data-interior-block="2"></div>
        </div>
    </div>
</section>
```

### 変更ポイント

- index=0 をタイトル専用ブロックに分離
- index=0 に `stack-block--header` モディファイアを追加
- コンテンツブロックは index=1, 2, 3 に変更
- data-interior-block の番号は 0, 1, 2 のまま維持

---

## 変更3: タイトルブロック用CSSの追加

### 追加位置

`.stack-block` の定義の直後に追加。

### 追加するCSS

```css
/* タイトル専用ブロック（min-height不要、余白調整） */
.stack-block--header {
    min-height: auto;
    padding-bottom: 2rem;
}
```

---

## 変更4: スタッキング計算ロジックの修正（JS）

### 目的

- index=0（タイトル）はグループの基本top位置
- index=1以降（コンテンツ）は基本top + タイトルの高さ

### 現状のJS（該当部分）

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

### 変更後のJS

```javascript
// ----- スタッキング位置の計算 -----
const blocks = document.querySelectorAll('.stack-block');
const baseTop = 32;      // 初期top値（px）= 2rem相当
const groupOffset = 16;  // グループ間のズレ幅（px）= 1rem相当

let currentTop = baseTop;
let currentZIndex = 2;   // heroが1なので2から開始

// グループごとのタイトルブロック情報を記録
const groupInfo = {};

// 1回目のループ: タイトルブロック（index=0）の位置設定と高さ取得
blocks.forEach((block) => {
    const group = block.dataset.group;
    const indexInGroup = parseInt(block.dataset.index, 10);

    if (indexInGroup === 0) {
        // グループの先頭（タイトル）→ ズレを加算して位置設定
        currentTop += groupOffset;
        block.style.top = `${currentTop}px`;
        block.style.zIndex = currentZIndex;
        currentZIndex++;

        // このグループの情報を記録
        groupInfo[group] = {
            headerTop: currentTop,
            headerHeight: block.offsetHeight
        };
    }
});

// 2回目のループ: コンテンツブロック（index>=1）の位置設定
blocks.forEach((block) => {
    const group = block.dataset.group;
    const indexInGroup = parseInt(block.dataset.index, 10);

    if (indexInGroup >= 1) {
        const info = groupInfo[group];
        if (info) {
            // タイトルの下にスタッキング
            const contentTop = info.headerTop + info.headerHeight;
            block.style.top = `${contentTop}px`;
        } else {
            // タイトルがないグループ（owner, access）→ 従来通り
            currentTop += groupOffset;
            block.style.top = `${currentTop}px`;
        }
        block.style.zIndex = currentZIndex;
        currentZIndex++;
    }
});
```

### 変更ポイント

- 2回ループで処理（1回目: タイトル、2回目: コンテンツ）
- タイトルブロックの高さを `offsetHeight` で取得
- コンテンツブロックのtopは「タイトルのtop + タイトルの高さ」
- owner, access（タイトル分離なし）は従来通りの動作

---

## 変更5: 画像の拡張子フォールバック対応（JS）

### 目的

画像ファイルの拡張子を自動判定し、WebP → PNG → JPG の優先順位で読み込む。

### 変更5-1: configの画像パスから拡張子を削除

#### 現状

```javascript
const config = {
    // ...
    heroImage: "image/main.jpg",
    
    menuItems: [
        { name: "焼き餃子", price: "600円〜", image: "image/image1.jpg" },
        { name: "水餃子", price: "600円〜", image: "image/image2.jpg" },
        { name: "ランチセット", price: "900円", image: "image/image3.jpg" },
        { name: "お持ち帰り", price: "600円〜", image: "image/image4.jpg" }
    ],
    
    interiorItems: [
        { image: "image/image1.jpg", caption: "モルタルの壁と白木のカウンター。" },
        { image: "image/image2.jpg", caption: "小さいけれど、ゆっくりくつろげる空間です。" },
        { image: "image/image3.jpg", caption: "お子さま用のチェアもご用意しています。" }
    ],
    
    ownerImage: "image/image2.jpg",
    // ...
};
```

#### 変更後

```javascript
const config = {
    // ...
    heroImage: "image/main",  // 拡張子なし
    
    menuItems: [
        { name: "焼き餃子", price: "600円〜", image: "image/image1" },
        { name: "水餃子", price: "600円〜", image: "image/image2" },
        { name: "ランチセット", price: "900円", image: "image/image3" },
        { name: "お持ち帰り", price: "600円〜", image: "image/image4" }
    ],
    
    interiorItems: [
        { image: "image/image1", caption: "モルタルの壁と白木のカウンター。" },
        { image: "image/image2", caption: "小さいけれど、ゆっくりくつろげる空間です。" },
        { image: "image/image3", caption: "お子さま用のチェアもご用意しています。" }
    ],
    
    ownerImage: "image/image2",
    // ...
};
```

#### 備考

- 拡張子だけ省く（ファイル名は変更しない）
- 実際のファイルが `image1.jpg` なら、フォールバックで正しく読み込まれる
- 将来 `image1.webp` を追加すればそちらが優先される

---

### 変更5-2: 画像読み込みユーティリティ関数の追加

#### 追加位置

`document.addEventListener('DOMContentLoaded', () => {` の直後に追加。

#### 追加するコード

```javascript
// ========================================
// 画像拡張子フォールバック
// ========================================
const imageExtensions = ['webp', 'png', 'jpg'];

/**
 * 画像の存在チェックを行い、最初に見つかった拡張子のパスを返す
 * @param {string} basePath - 拡張子なしの画像パス
 * @returns {Promise<string>} - 見つかった画像のフルパス
 */
function resolveImagePath(basePath) {
    return new Promise((resolve) => {
        let index = 0;
        
        function tryNext() {
            if (index >= imageExtensions.length) {
                // 全部失敗 → 最後の拡張子でフォールバック
                resolve(`${basePath}.${imageExtensions[imageExtensions.length - 1]}`);
                return;
            }
            
            const ext = imageExtensions[index];
            const fullPath = `${basePath}.${ext}`;
            const img = new Image();
            
            img.onload = () => resolve(fullPath);
            img.onerror = () => {
                index++;
                tryNext();
            };
            
            img.src = fullPath;
        }
        
        tryNext();
    });
}

/**
 * 複数の画像パスを一括で解決
 * @param {string[]} basePaths - 拡張子なしの画像パス配列
 * @returns {Promise<string[]>} - 解決済みパス配列
 */
function resolveImagePaths(basePaths) {
    return Promise.all(basePaths.map(p => resolveImagePath(p)));
}
```

---

### 変更5-3: ヒーロー画像の読み込み修正

#### 現状

```javascript
// ----- ヒーロー -----
const heroSection = document.getElementById('hero');
if (heroSection) {
    heroSection.style.backgroundImage = `url('${config.heroImage}')`;
}
```

#### 変更後

```javascript
// ----- ヒーロー -----
const heroSection = document.getElementById('hero');
if (heroSection) {
    resolveImagePath(config.heroImage).then(path => {
        heroSection.style.backgroundImage = `url('${path}')`;
    });
}
```

---

### 変更5-4: メニュー画像の読み込み修正

#### 現状

```javascript
// ----- メニュー -----
const menuBlocks = document.querySelectorAll('[data-menu-block]');
if (menuBlocks.length > 0) {
    config.menuItems.forEach((item, index) => {
        const blockIndex = Math.floor(index / 2);
        const targetBlock = menuBlocks[blockIndex];
        if (targetBlock) {
            const div = document.createElement('div');
            div.className = 'menu-item';
            div.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="menu-img" loading="lazy" width="300" height="300">
                <span class="menu-name">${item.name}</span>
                <span class="menu-price">${item.price}</span>
            `;
            targetBlock.appendChild(div);
        }
    });
}
```

#### 変更後

```javascript
// ----- メニュー -----
const menuBlocks = document.querySelectorAll('[data-menu-block]');
if (menuBlocks.length > 0) {
    const menuImagePaths = config.menuItems.map(item => item.image);
    
    resolveImagePaths(menuImagePaths).then(resolvedPaths => {
        config.menuItems.forEach((item, index) => {
            const blockIndex = Math.floor(index / 2);
            const targetBlock = menuBlocks[blockIndex];
            if (targetBlock) {
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.innerHTML = `
                    <img src="${resolvedPaths[index]}" alt="${item.name}" class="menu-img" loading="lazy" width="300" height="300">
                    <span class="menu-name">${item.name}</span>
                    <span class="menu-price">${item.price}</span>
                `;
                targetBlock.appendChild(div);
            }
        });
    });
}
```

---

### 変更5-5: 店内雰囲気画像の読み込み修正

#### 現状

```javascript
// ----- 店内雰囲気 -----
const interiorBlocks = document.querySelectorAll('[data-interior-block]');
if (interiorBlocks.length > 0 && config.interiorItems) {
    config.interiorItems.forEach((item, index) => {
        const targetBlock = interiorBlocks[index];
        if (targetBlock) {
            const div = document.createElement('div');
            div.className = 'interior-item';
            div.innerHTML = `
                <img src="${item.image}" alt="店内の様子 ${index + 1}" class="interior-img" loading="lazy">
                <p class="interior-caption">${item.caption}</p>
            `;
            targetBlock.appendChild(div);
        }
    });
}
```

#### 変更後

```javascript
// ----- 店内雰囲気 -----
const interiorBlocks = document.querySelectorAll('[data-interior-block]');
if (interiorBlocks.length > 0 && config.interiorItems) {
    const interiorImagePaths = config.interiorItems.map(item => item.image);
    
    resolveImagePaths(interiorImagePaths).then(resolvedPaths => {
        config.interiorItems.forEach((item, index) => {
            const targetBlock = interiorBlocks[index];
            if (targetBlock) {
                const div = document.createElement('div');
                div.className = 'interior-item';
                div.innerHTML = `
                    <img src="${resolvedPaths[index]}" alt="店内の様子 ${index + 1}" class="interior-img" loading="lazy">
                    <p class="interior-caption">${item.caption}</p>
                `;
                targetBlock.appendChild(div);
            }
        });
    });
}
```

---

### 変更5-6: オーナー画像の読み込み修正

#### 現状

```javascript
// ----- オーナー -----
const ownerImg = document.getElementById('owner-img');
if (ownerImg) {
    ownerImg.src = config.ownerImage;
}
```

#### 変更後

```javascript
// ----- オーナー -----
const ownerImg = document.getElementById('owner-img');
if (ownerImg) {
    resolveImagePath(config.ownerImage).then(path => {
        ownerImg.src = path;
    });
}
```

---

## 確認用チェックリスト

実装後に確認すべき項目：

~~~yaml
PC版:
  - [ ] menuセクション: 「01 / Menu」「メニュー」が常に見えているか
  - [ ] menuセクション: 写真グリッドがスタッキングで重なるか
  - [ ] menuセクション: タイトルとコンテンツの間に不自然な隙間がないか
  - [ ] interiorセクション: 「02 / Interior」「店内」が常に見えているか
  - [ ] interiorセクション: 写真がスタッキングで重なるか
  - [ ] ownerセクション: 従来通りの動作か（影響なし）
  - [ ] accessセクション: 従来通りの動作か（影響なし）
  - [ ] 全体のスタッキング順序が正しいか

画像フォールバック:
  - [ ] 既存のJPG画像（image1.jpg等）が正しく表示されるか
  - [ ] WebPファイルを追加した場合、優先的に読み込まれるか
  - [ ] ヒーロー、メニュー、店内、オーナー全セクションで画像が表示されるか
~~~

---

## 補足

~~~yaml
Astro移行時の注意:
  - .stack-block と .stack-block--header のクラス構造は維持
  - data-group, data-index 属性はコンポーネント化時に活用可能
  - JSの動的計算部分は、Astroのクライアントサイドスクリプトとして残す
  - 画像フォールバックロジックはビルドスクリプトに移植し、静的に解決する

ファイル命名規則への移行（別作業）:
  - 現状: image1.jpg, image2.jpg ...
  - 推奨: menu-1.webp, interior-1.webp, owner-1.webp ...
  - 移行時はconfigのパスも合わせて変更する

スマホ版対応（後日）:
  - PC版で安定した後に対応予定
  - メディアクエリの修正が必要
~~~