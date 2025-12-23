# HAYAKAWA餃子 HP 修正計画書（第3版）

## 概要

~~~yaml
対象: 第2版修正適用後のindex.html
目的: レビューで発見された問題の修正と機能追加
~~~

---

## 1. セクション内スクロール対応

### 対象

`.sticky-card` 全体に適用（コンテンツが大きくなったセクションで自動的にスクロール可能になる）

### CSS変更

```css
/* 変更前 */
.sticky-card {
    background: var(--bg-section);
    padding: 5rem;
    margin-bottom: 4rem;
    min-height: 80vh;
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex; flex-direction: column;
    position: sticky; top: 2rem;
}

/* 変更後 */
.sticky-card {
    background: var(--bg-section);
    padding: 5rem;
    margin-bottom: 4rem;
    max-height: 85vh;          /* 追加 */
    overflow-y: auto;          /* 追加 */
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex; flex-direction: column;
    position: sticky; top: 2rem;
    /* min-height: 80vh は削除 */
}
```

### カスタムスクロールバー

```css
/* ===== カスタムスクロールバー ===== */

/* Webkit系（Chrome, Safari, Edge） */
.sticky-card::-webkit-scrollbar {
    width: 8px;
}

.sticky-card::-webkit-scrollbar-track {
    background: #eee;
    border-radius: 4px;
}

.sticky-card::-webkit-scrollbar-thumb {
    background: var(--color-accent);
    border-radius: 4px;
}

.sticky-card::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
}

/* Firefox */
.sticky-card {
    scrollbar-width: thin;
    scrollbar-color: var(--color-accent) #eee;
}
```

---

## 2. 店内写真の複数化

### HTML変更

```html
<!-- 変更前 -->
<img id="interior-img" class="interior-img" src="" alt="店内の様子" loading="lazy">

<!-- 変更後 -->
<div id="interior-gallery" class="interior-gallery"></div>
```

### CSS追加

```css
/* ===== 店内ギャラリー ===== */
.interior-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.interior-img {
    width: 100%;
    border-radius: 4px;
}
```

### config変更

```javascript
// 変更前
interiorImage: "image/image1.jpg",

// 変更後
interiorImages: [
    "image/image1.jpg",
    "image/image2.jpg"
],
```

### JS変更

```javascript
// 変更前
const interiorImg = document.getElementById('interior-img');
if (interiorImg) {
    interiorImg.src = config.interiorImage;
}

// 変更後
const interiorGallery = document.getElementById('interior-gallery');
if (interiorGallery && config.interiorImages) {
    config.interiorImages.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `店内の様子 ${index + 1}`;
        img.className = 'interior-img';
        img.loading = 'lazy';
        interiorGallery.appendChild(img);
    });
}
```

---

## 3. オーナーセクションのスタッキング復活

### CSS変更

```css
/* 変更前 */
#owner {
    position: relative; top: auto; z-index: 4;
    border-top: 1px solid #eee;
    margin-top: -3rem;
    min-height: auto;
}

/* 変更後 */
#owner {
    top: 5rem; z-index: 4;
    border-top: 1px solid #eee;
}
```

備考: `.sticky-card` の共通スタイルで `position: sticky` が適用されるため、個別指定は不要。

---

## 4. コンテナクエリによる統一レスポンシブ

### コンテナ定義

```css
/* .main にコンテナクエリ定義を追加 */
.main {
    flex: 1;
    padding: 4rem;
    max-width: 1200px;
    container-type: inline-size;    /* 追加 */
    container-name: main-content;   /* 追加 */
}
```

### コンテナクエリ追加

```css
/* ===== コンテナクエリ：メインカラム幅550px以下で1カラム化 ===== */
@container main-content (max-width: 550px) {
    /* メニューグリッド */
    .menu-grid {
        grid-template-columns: 1fr;
    }
    
    /* オーナー */
    .owner-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .owner-photo {
        max-width: 150px;
    }
    
    /* アクセス */
    .access-container {
        flex-direction: column;
    }
    
    .access-embed {
        min-height: 250px;
    }
}
```

### 既存メディアクエリの調整

既存の `@media (max-width: 900px)` 内から、コンテナクエリで対応した部分を削除：

```css
/* 変更前 */
@media (max-width: 900px) {
    /* ... サイドバー関連 ... */
    
    .owner-container {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .owner-photo {
        flex: none;
        max-width: 150px;
    }
    
    .access-container {
        flex-direction: column;
    }
    
    .access-embed {
        min-height: 250px;
    }
}

/* 変更後 */
@media (max-width: 900px) {
    /* ... サイドバー関連のみ残す ... */
    /* owner-container, access-container はコンテナクエリに移動したので削除 */
}
```

---

## 5. ページ末尾の濃いセクション追加

### HTML追加

`</section><!-- #access -->` の後、`</main>` の前に追加：

```html
<section id="closing" class="sticky-card closing-section">
    <div class="closing-content">
        <p class="closing-message">ご来店をお待ちしております</p>
    </div>
</section>
```

### CSS追加

```css
/* ===== 締めセクション ===== */
#closing {
    top: 6rem; z-index: 6;
}

.closing-section {
    background: var(--color-text);
    color: #fff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.closing-content {
    text-align: center;
}

.closing-message {
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0;
}
```

---

## 6. アクセスセクションの調整

#accessも他のセクションと同様にstickyに戻す：

### CSS変更

```css
/* 変更前 */
#access {
    position: relative; top: auto; z-index: 5;
    border-top: 1px solid #eee;
    margin-top: -3rem; margin-bottom: 0;
    min-height: auto;
}

/* 変更後 */
#access {
    top: 5.5rem; z-index: 5;
    border-top: 1px solid #eee;
}
```

---

## 7. 各セクションのtop/z-index調整

```css
#hero { top: 2rem; z-index: 1; }
#menu { top: 3rem; z-index: 2; }
#interior { top: 4rem; z-index: 3; }
#owner { top: 5rem; z-index: 4; }
#access { top: 5.5rem; z-index: 5; }
#closing { top: 6rem; z-index: 6; }
```

---

## 作業チェックリスト

~~~yaml
CSS変更:
  - [ ] .sticky-card から min-height: 80vh を削除
  - [ ] .sticky-card に max-height: 85vh, overflow-y: auto を追加
  - [ ] カスタムスクロールバースタイルを追加
  - [ ] .main にコンテナクエリ定義を追加
  - [ ] @container クエリを追加（メニュー、オーナー、アクセス）
  - [ ] 既存メディアクエリから重複部分を削除
  - [ ] #owner のCSSを修正（sticky化）
  - [ ] #access のCSSを修正（sticky化）
  - [ ] .closing-section スタイルを追加
  - [ ] 各セクションの top, z-index を調整
  - [ ] .interior-gallery スタイルを追加

HTML変更:
  - [ ] 店内写真を div#interior-gallery に変更
  - [ ] #closing セクションを追加

JavaScript変更:
  - [ ] config.interiorImage を config.interiorImages 配列に変更
  - [ ] 店内写真の描画処理を複数対応に変更
~~~
