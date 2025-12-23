# HAYAKAWA餃子 HP 修正計画書（第4版）

## 概要

~~~yaml
対象: 第3版修正適用後のindex.html
目的: レビューで発見された問題の修正と機能追加
~~~

---

## 1. セクション共通のスクロール対応

### CSS変更

```css
/* .sticky-card に追加・変更 */
.sticky-card {
    background: var(--bg-section);
    padding: 5rem;
    margin-bottom: 4rem;
    min-height: 80vh;           /* 維持 */
    max-height: 90vh;           /* 追加 */
    overflow-y: auto;           /* 追加 */
    box-shadow: 0 5px 20px rgba(0,0,0,0.05);
    display: flex; flex-direction: column;
    position: sticky; top: 2rem;
    
    /* スクロールバー非表示 */
    -ms-overflow-style: none;   /* IE, Edge */
    scrollbar-width: none;      /* Firefox */
}

/* Chrome, Safari */
.sticky-card::-webkit-scrollbar {
    display: none;
}
```

---

## 2. ヒーローセクションの個別設定

### CSS変更

```css
#hero {
    top: 2rem; z-index: 1;
    min-height: 80vh;           /* 個別指定で維持 */
    max-height: none;           /* max-height を解除 */
    overflow: visible;          /* スクロール不要 */
    justify-content: flex-end;
    background-image: url('image/main.jpg');
    background-size: cover; background-position: center;
    color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
```

---

## 3. JS伝播制御（wheel + touch対応）

### JavaScript追加

`</script>` の直前に追加：

```javascript
// ===============================================
//  セクション内スクロールの伝播制御
// ===============================================
document.querySelectorAll('.sticky-card').forEach(section => {
    // ヒーローは対象外
    if (section.id === 'hero') return;
    
    // Wheel イベント（PC）
    section.addEventListener('wheel', (e) => {
        const atTop = section.scrollTop === 0;
        const atBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 1;
        
        // 最上部で上スクロール、または最下部で下スクロールなら親に伝播
        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
            // デフォルト動作（親へ伝播）を許可
            return;
        }
        
        // それ以外はセクション内スクロール
        e.stopPropagation();
    }, { passive: true });
    
    // Touch イベント（スマホ）
    let touchStartY = 0;
    
    section.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    section.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY; // 正: 下スクロール、負: 上スクロール
        
        const atTop = section.scrollTop === 0;
        const atBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 1;
        
        // 最上部で上スクロール、または最下部で下スクロールなら親に伝播
        if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
            return;
        }
        
        // それ以外はセクション内スクロール（伝播を止める必要がある場合）
        // ただし passive: true なので preventDefault は使えない
        // 伝播制御は stopPropagation で行う
    }, { passive: true });
});
```

---

## 4. メニュー画像のアスペクト比維持

### CSS変更

```css
.menu-img {
    width: 100%;
    aspect-ratio: 1 / 1;        /* スクエア維持 */
    object-fit: cover;
    object-position: center;    /* 中央基準で切り抜き */
    border-radius: 4px;
    background: #eee;
    /* height は指定しない（aspect-ratio に任せる） */
}
```

---

## 5. 店内写真セクションの変更

### HTML変更

```html
<!-- 変更前 -->
<img id="interior-img" class="interior-img" src="" alt="店内の様子" loading="lazy">
<p id="interior-text" class="interior-text"></p>

<!-- 変更後 -->
<div id="interior-gallery" class="interior-gallery"></div>
```

### CSS変更

```css
/* 変更前 */
.interior-img {
    width: 100%;
    border-radius: 4px;
    margin-bottom: 1.5rem;
}

/* 変更後 */
.interior-gallery {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.interior-item {
    /* 画像 + コメントのセット */
}

.interior-img {
    width: 100%;
    aspect-ratio: 16 / 9;       /* 横長 */
    object-fit: cover;
    object-position: center;    /* 中央基準で切り抜き */
    border-radius: 4px;
    background: #eee;
}

.interior-caption {
    font-size: 0.95rem;
    line-height: 1.8;
    color: var(--color-text);
    margin-top: 0.75rem;
}
```

### config変更

```javascript
// 変更前
interiorImage: "image/image1.jpg",
interiorText: "モルタルの壁と白木のカウンター。\n小さいけれど、ゆっくりくつろげる空間です。",

// 変更後
interiorItems: [
    {
        image: "image/image1.jpg",
        caption: "モルタルの壁と白木のカウンター。"
    },
    {
        image: "image/image2.jpg",
        caption: "小さいけれど、ゆっくりくつろげる空間です。"
    },
    {
        image: "image/image3.jpg",
        caption: "お子さま用のチェアもご用意しています。"
    }
],
```

### JavaScript変更

```javascript
// 変更前
const interiorImg = document.getElementById('interior-img');
if (interiorImg) {
    interiorImg.src = config.interiorImage;
}
const interiorText = document.getElementById('interior-text');
if (interiorText) {
    interiorText.textContent = config.interiorText;
}

// 変更後
const interiorGallery = document.getElementById('interior-gallery');
if (interiorGallery && config.interiorItems) {
    config.interiorItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'interior-item';
        div.innerHTML = `
            <img src="${item.image}" alt="店内の様子 ${index + 1}" class="interior-img" loading="lazy">
            <p class="interior-caption">${item.caption}</p>
        `;
        interiorGallery.appendChild(div);
    });
}
```

---

## 6. オーナーセクションのスタッキング復活

### CSS変更

```css
/* 変更前 */
#owner {
    position: relative; top: auto; z-index: 4;
    border-top: 1px solid #eee;
    margin-top: -3rem;
    min-height: auto;
}

/* 変更後（個別指定を削除し、.sticky-card の共通スタイルに任せる） */
#owner {
    top: 5rem; z-index: 4;
    border-top: 1px solid #eee;
}
```

---

## 7. アクセスセクションのダーク化

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
    background: var(--color-text);  /* ダーク背景 */
    color: #fff;                    /* 白テキスト */
    border: none;                   /* ボーダー削除 */
}

/* アクセス内の要素の色調整 */
#access .card-header {
    border-color: rgba(255, 255, 255, 0.3);
}

#access h2 {
    color: #fff;
}

#access dt {
    color: rgba(255, 255, 255, 0.7);
}

#access dd {
    color: #fff;
}

#access .access-note {
    color: rgba(255, 255, 255, 0.7);
}

#access .access-embed {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
}

/* ボタンはアクセントカラーのまま */
#access .access-btn {
    background: var(--color-accent);
    color: #fff;
}
```

### HTMLから #closing を削除

第3版で追加した #closing セクションがある場合は削除する。

---

## 8. コンテナクエリによる統一レスポンシブ

### .main にコンテナ定義を追加

```css
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

### 既存メディアクエリから重複削除

`@media (max-width: 900px)` 内から、コンテナクエリで対応した `.owner-container`、`.access-container` 関連を削除。

---

## 9. 各セクションの top / z-index 調整

```css
#hero { top: 2rem; z-index: 1; }
#menu { top: 3rem; z-index: 2; }
#interior { top: 4rem; z-index: 3; }
#owner { top: 5rem; z-index: 4; }
#access { top: 5.5rem; z-index: 5; }
```

---

## 作業チェックリスト

~~~yaml
CSS:
  - [ ] .sticky-card に max-height: 90vh, overflow-y: auto 追加
  - [ ] .sticky-card のスクロールバー非表示
  - [ ] #hero に min-height, max-height: none, overflow: visible を個別指定
  - [ ] .menu-img に aspect-ratio: 1/1, object-position: center
  - [ ] .interior-gallery, .interior-item, .interior-img, .interior-caption 追加
  - [ ] .interior-img に aspect-ratio: 16/9
  - [ ] #owner の個別指定を削除（sticky化）
  - [ ] #access のダーク化スタイル追加
  - [ ] .main にコンテナクエリ定義追加
  - [ ] @container クエリ追加
  - [ ] 既存メディアクエリから重複削除
  - [ ] 各セクションの top, z-index 調整

HTML:
  - [ ] 店内セクションを div#interior-gallery に変更
  - [ ] #closing セクションがあれば削除

JavaScript:
  - [ ] config.interiorItems 配列に変更
  - [ ] 店内写真の描画処理を変更
  - [ ] セクション内スクロールの伝播制御を追加（wheel + touch）
~~~

---

## コミットコメント

~~~
feat: HAYAKAWA餃子HP レイアウト・機能改善

## 変更内容

### スクロール関連
- セクション内スクロール対応（max-height + overflow-y: auto）
- スクロールバー非表示（CSS）
- JS伝播制御追加（wheel + touch対応）
  - 最上部/最下部でページスクロールに移行

### ヒーロー
- フルハイト維持（min-height: 80vh, max-height解除）

### メニュー
- 画像アスペクト比1:1維持

### 店内写真
- 複数枚対応（3枚 × 画像+キャプション構成）
- アスペクト比16:9、中央基準で切り抜き

### オーナー
- スタッキング復活（sticky化）

### アクセス
- ダーク背景化（#2D2926 + 白テキスト）
- ページの視覚的な締まりを実現

### レスポンシブ
- コンテナクエリ導入（550px閾値）
- メニュー/オーナー/アクセスの1カラム化を統一
~~~
