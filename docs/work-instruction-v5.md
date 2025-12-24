# スタッキング構造変更 作業指示書（v2）

## 修正の目的

### 背景
現状のスタッキング実装では、セクション単位（hero, menu, interior, owner, access）でのみスタッキングが機能している。しかし、メニューや店内雰囲気のように**複数のコンテンツブロックを持つセクション**では、セクション内でのスクロールが発生し、「カードが次々と重なっていく」という演出が十分に活かされていない。

### 解決したいこと
- コンテンツを適切な単位でブロック分割し、それぞれをスタッキング対象にする
- 同一セクション内のブロックは**同じ位置にスタック**（追加ズレなし）
- 異なるセクションに移る時のみ**ズレを発生**させる
- HTMLのセマンティック構造（section要素によるグループ化）は維持する

### 採用するアプローチ
`display: contents` を使用し、section要素をレイアウトから透明化する。これにより：
- DOMとしてはsectionが存在（セマンティクス・アクセシビリティ維持）
- レイアウト上はsection内のブロックが直接mainの子要素として振る舞う
- ブロック単位でのスタッキングが可能になる

---

## 変更対象

| セクション | 分割単位 | ブロック数 | 備考 |
|-----------|----------|-----------|------|
| hero | - | - | 変更なし（現状維持） |
| menu | 2アイテムずつ | 2 | PC=横2個、SP=縦2個が1単位 |
| interior | 1アイテムずつ | 3 | PCで1個半しか見えないため |
| owner | - | 1 | そのまま |
| access | - | 1 | そのまま |
| footer | - | 削除 | コピーライトのみ残す |

---

## 作業内容

### 1. CSS変更

#### 1-1. セクションのレイアウト透明化
~~~css
/* 追加 */
main > section:not(#hero) {
    display: contents;
}
~~~

#### 1-2. スタッキング対象クラスの追加
~~~css
/* 追加：スタッキングブロック共通 */
.stack-block {
    background: var(--bg-section);
    padding: 5rem;
    margin-bottom: 4rem;
    min-height: 80vh;
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    position: sticky;
    border-top: 1px solid #eee;
    /* top と z-index は JS で動的に設定 */
}
~~~

#### 1-3. 個別セクションのtop/z-index指定を変更
~~~css
/* 変更前 */
#hero { top: 2rem; z-index: 1; /* 他のスタイル */ }
#menu { top: 3rem; z-index: 2; border-top: 1px solid #eee; }
#interior { top: 4rem; z-index: 3; border-top: 1px solid #eee; }
#owner { top: 5rem; z-index: 4; border-top: 1px solid #eee; }
#access { top: 5.5rem; z-index: 5; /* 他のスタイル */ }

/* 変更後 */
#hero { top: 2rem; z-index: 1; /* 他のスタイルは維持 */ }
/* menu, interior, owner, access の top/z-index/border-top は削除 */
/* → .stack-block と JS で制御 */
~~~

#### 1-4. accessセクションのダークテーマ対応
~~~css
/* 変更：セレクタを .stack-block[data-group="access"] に */
.stack-block[data-group="access"] {
    background: var(--color-text);
    color: #fff;
    border: none;
}

.stack-block[data-group="access"] .card-header {
    border-color: rgba(255, 255, 255, 0.3);
}

/* 他の #access 内要素も同様にセレクタ変更 */
~~~

#### 1-5. フッター関連の削除とコピーライト追加
~~~css
/* 削除 */
.site-footer { /* 全て削除 */ }
.footer-icons { /* 全て削除 */ }
.footer-copy { /* 全て削除 */ }

/* 追加：シンプルなコピーライト */
.copyright {
    text-align: center;
    padding: 2rem;
    font-size: 0.75rem;
    color: var(--color-text-sub);
    background: var(--bg-main);
}
~~~

#### 1-6. 削除対象CSS
~~~css
/* 削除：内部スクロール関連 */
.sticky-card {
    max-height: 90vh;        /* 削除 */
    overflow-y: auto;        /* 削除 */
    -ms-overflow-style: none; /* 削除 */
    scrollbar-width: none;    /* 削除 */
}
.sticky-card::-webkit-scrollbar { /* 全て削除 */ }
~~~

---

### 2. HTML変更

#### 2-1. heroセクション
**変更なし** - 現状のまま維持

#### 2-2. menuセクション

**変更前：**
```html
<section id="menu" class="sticky-card">
    <div class="card-header">
        <span class="card-number">01</span>
        <h2 class="card-title">Menu</h2>
    </div>
    <div id="menu-grid" class="menu-grid">
        <!-- JS で4アイテム生成 -->
    </div>
</section>
```

**変更後：**
```html
<section id="menu" aria-label="メニュー">
    <div class="stack-block" data-group="menu" data-index="0">
        <div class="card-header">
            <span class="card-number">01</span>
            <h2 class="card-title">Menu</h2>
        </div>
        <div class="menu-grid" data-menu-block="0">
            <!-- JS で2アイテム生成 -->
        </div>
    </div>
    <div class="stack-block" data-group="menu" data-index="1">
        <div class="menu-grid" data-menu-block="1">
            <!-- JS で2アイテム生成 -->
        </div>
    </div>
</section>
```

#### 2-3. interiorセクション

**変更前：**
```html
<section id="interior" class="sticky-card">
    <div class="card-header">
        <span class="card-number">02</span>
        <h2 class="card-title">Interior</h2>
    </div>
    <div id="interior-gallery" class="interior-gallery">
        <!-- JS で3アイテム生成 -->
    </div>
</section>
```

**変更後：**
```html
<section id="interior" aria-label="店内雰囲気">
    <div class="stack-block" data-group="interior" data-index="0">
        <div class="card-header">
            <span class="card-number">02</span>
            <h2 class="card-title">Interior</h2>
        </div>
        <div class="interior-gallery" data-interior-block="0">
            <!-- JS で1アイテム生成 -->
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="1">
        <div class="interior-gallery" data-interior-block="1">
            <!-- JS で1アイテム生成 -->
        </div>
    </div>
    <div class="stack-block" data-group="interior" data-index="2">
        <div class="interior-gallery" data-interior-block="2">
            <!-- JS で1アイテム生成 -->
        </div>
    </div>
</section>
```

#### 2-4. ownerセクション

**変更前：**
```html
<section id="owner" class="sticky-card">
    <!-- 内容 -->
</section>
```

**変更後：**
```html
<section id="owner" aria-label="店主紹介">
    <div class="stack-block" data-group="owner" data-index="0">
        <!-- 内容そのまま -->
    </div>
</section>
```

#### 2-5. accessセクション

**変更前：**
```html
<section id="access" class="sticky-card">
    <!-- 内容 -->
</section>
```

**変更後：**
```html
<section id="access" aria-label="アクセス">
    <div class="stack-block" data-group="access" data-index="0">
        <!-- 内容そのまま -->
    </div>
</section>
```

#### 2-6. フッター

**変更前：**
```html
<footer class="site-footer">
    <div class="footer-icons">
        <a id="footer-instagram" href="#" ...><!-- Instagram SVG --></a>
        <a id="footer-gbp" href="#" ...><!-- Google SVG --></a>
    </div>
    <p class="footer-copy">&copy; 2025 HAYAKAWA餃子</p>
</footer>
```

**変更後：**
```html
<p class="copyright">&copy; 2025 HAYAKAWA餃子</p>
```

---

### 3. JavaScript変更

#### 3-1. スタッキング位置計算の追加

~~~javascript
// DOMContentLoaded 内に追加
// スタッキング位置の計算
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
~~~

#### 3-2. メニュー生成ロジックの変更

~~~javascript
/* 変更前 */
const menuGrid = document.getElementById('menu-grid');
if (menuGrid) {
    config.menuItems.forEach(item => {
        // ...
        menuGrid.appendChild(div);
    });
}

/* 変更後 */
const menuBlocks = document.querySelectorAll('[data-menu-block]');
if (menuBlocks.length > 0) {
    config.menuItems.forEach((item, index) => {
        const blockIndex = Math.floor(index / 2); // 2個ずつ
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
~~~

#### 3-3. 店内雰囲気生成ロジックの変更

~~~javascript
/* 変更前 */
const interiorGallery = document.getElementById('interior-gallery');
if (interiorGallery && config.interiorItems) {
    config.interiorItems.forEach((item, index) => {
        // ...
        interiorGallery.appendChild(div);
    });
}

/* 変更後 */
const interiorBlocks = document.querySelectorAll('[data-interior-block]');
if (interiorBlocks.length > 0 && config.interiorItems) {
    config.interiorItems.forEach((item, index) => {
        const targetBlock = interiorBlocks[index]; // 1個ずつ
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
~~~

#### 3-4. 削除対象JS

~~~javascript
/* 削除：フッターリンク設定 */
document.getElementById('footer-instagram').href = config.instagramUrl;
document.getElementById('footer-gbp').href = config.gbpUrl;

/* 削除：セクション内スクロールの伝播制御（全体） */
document.querySelectorAll('.sticky-card').forEach(section => {
    // ... wheel/touch イベント処理すべて ...
});
~~~

---

## 期待される動作

1. **スクロール開始** → heroが表示（現状通り）
2. **スクロール継続** → menuブロック0がheroの上に少しズレて重なる
3. **さらにスクロール** → menuブロック1がブロック0と**同じ位置**に重なる
4. **さらにスクロール** → interiorブロック0が**ズレて**重なる（新グループ）
5. **さらにスクロール** → interiorブロック1が**同じ位置**に重なる
6. **さらにスクロール** → interiorブロック2が**同じ位置**に重なる
7. **さらにスクロール** → ownerブロックが**ズレて**重なる
8. **さらにスクロール** → accessブロックが**ズレて**重なる
9. **最下部** → コピーライトが一行表示

---

## 確認ポイント

- [ ] heroセクションが現状通り動作するか
- [ ] セマンティック構造（section）が維持されているか
- [ ] 同一グループ内のブロックが同じ位置にスタックするか
- [ ] グループが変わる時にズレが発生するか
- [ ] メニューが2個ずつ正しく分割されているか
- [ ] 店内雰囲気が1個ずつ正しく分割されているか
- [ ] accessセクションのダークテーマが維持されているか
- [ ] フッターが削除され、コピーライトのみ表示されるか
- [ ] SP表示（899px以下）での挙動

---

## 備考

- heroは `.stack-block` を使用せず、現状の `.sticky-card` 構造を維持
- `main > section:not(#hero)` で hero 以外にのみ `display: contents` を適用
- z-indexはheroが1、以降のstack-blockは2から順に増加
