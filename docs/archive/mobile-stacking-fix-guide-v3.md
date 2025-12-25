# モバイル版スタッキング実装指示書 v3

## 方針

PC版の `position: sticky` をモバイルで再現することを諦め、**モバイル専用の「重なり感演出UI」** を別実装する。

~~~yaml
設計判断:
  Hero: "通常スクロールで流れてOK（sticky解除）"
  カード演出: "全カード同じ演出（特別扱いなし）"
  PC版: "既存の sticky スタッキングを維持（変更なし）"
~~~

---

## 変更箇所

### 1. CSS変更（@media max-width: 900px 内）

**対象:** 行558〜611付近の `@media (max-width: 900px)` 内

#### 1-1. `.sticky-card` の変更

```css
/* 変更前 */
.sticky-card {
    padding: 2rem;
    max-height: none;
    overflow-y: visible;
    margin-top: 0 !important;
    margin-bottom: 1rem !important;
    width: 100%;
    box-sizing: border-box;
    position: sticky;
    top: 0;
}

/* 変更後 */
.sticky-card {
    padding: 2rem;
    max-height: none;
    overflow-y: visible;
    margin-top: 0 !important;
    margin-bottom: 1rem !important;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    top: auto;
    will-change: transform, box-shadow;
}
```

#### 1-2. `.stack-block` の変更

```css
/* 変更前 */
.stack-block {
    padding: 2rem;
    min-height: auto;
    margin-bottom: 1rem;
    width: 100%;
    box-sizing: border-box;
    position: sticky;
    /* top, z-index はJSで設定されるため上書きしない */
}

/* 変更後 */
.stack-block {
    padding: 2rem;
    min-height: auto;
    margin-bottom: 1rem;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    top: auto;
    will-change: transform, box-shadow;
}
```

#### 1-3. `.following` クラスの無効化を追加

```css
/* 追加：モバイルでは following の特別扱いを無効化 */
.stack-block.following {
    border-top: 1px solid #eee;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
}
```

---

### 2. JavaScript変更

**対象:** DOMContentLoaded イベントリスナー内、スタッキング位置計算の後（行946〜975付近の後）

#### 2-1. 既存のスタッキング計算をモバイル時はスキップ

既存コード（行946〜975付近）を条件分岐で囲む：

```javascript
// ----- スタッキング位置の計算 -----
const isMobile = window.matchMedia('(max-width: 900px)').matches;

if (!isMobile) {
    // PC版のみ: 既存のスタッキング計算を実行
    const blocks = document.querySelectorAll('.stack-block');
    const baseTop = 32;
    const groupOffset = 16;
    const followingOffset = 120;

    let currentTop = baseTop;
    let currentZIndex = 2;

    blocks.forEach((block) => {
        const indexInGroup = parseInt(block.dataset.index, 10);

        if (indexInGroup === 0) {
            currentTop += groupOffset;
        } else {
            block.classList.add('following');
        }

        const topValue = block.classList.contains('following')
            ? currentTop + followingOffset
            : currentTop;

        block.style.top = `${topValue}px`;
        block.style.zIndex = currentZIndex;

        currentZIndex++;
    });
}
```

#### 2-2. モバイル用演出を追加

PC版スタッキング計算の後に追加：

```javascript
// ===============================================
// モバイル用スタッキング演出
// ===============================================
if (isMobile) {
    const stackBlocks = document.querySelectorAll('.stack-block');
    
    // following クラスを除去（CSSで再設定されるが、念のため）
    stackBlocks.forEach((block, index) => {
        block.classList.remove('following');
        block.style.top = 'auto';
        block.style.zIndex = index + 2;
        block.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    });

    // Hero も同様に処理
    const heroCard = document.querySelector('.sticky-card');
    if (heroCard) {
        heroCard.style.top = 'auto';
        heroCard.style.zIndex = 1;
        heroCard.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    }

    // IntersectionObserver で重なり感演出
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: [0, 0.5, 1]  // 粗めに設定（カクつき防止）
    };

    const stackObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const block = entry.target;
            const ratio = entry.intersectionRatio;
            
            if (entry.isIntersecting) {
                // 画面内：スクロールに応じて変形
                const translateY = (1 - ratio) * 20;
                const scale = 0.97 + (ratio * 0.03);
                
                block.style.transform = `translateY(${translateY}px) scale(${scale})`;
                block.style.boxShadow = `0 ${8 - ratio * 4}px ${16 - ratio * 8}px rgba(0,0,0,${0.08 - ratio * 0.04})`;
            }
        });
    }, observerOptions);

    // .stack-block のみ監視（Hero は含めない）
    stackBlocks.forEach(block => {
        stackObserver.observe(block);
    });

    // リサイズ対応（ブレークポイントをまたいだらリロード）
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const newIsMobile = window.matchMedia('(max-width: 900px)').matches;
            if (!newIsMobile) {
                location.reload();
            }
        }, 250);
    });
}
```

---

## 変更箇所まとめ

~~~yaml
対象ファイル: index.html

CSS変更（@media max-width: 900px 内）:
  .sticky-card:
    - position: sticky → relative
    - top: 0 → auto
    - will-change: transform, box-shadow 追加
    
  .stack-block:
    - position: sticky → relative
    - top: auto 追加
    - will-change: transform, box-shadow 追加
    
  .stack-block.following:
    - border-top と box-shadow を再設定（PC版で消されているのを復活）

JavaScript変更:
  既存のスタッキング計算:
    - if (!isMobile) で囲んでPC版のみ実行
    
  新規追加:
    - isMobile 判定
    - モバイル用演出（IntersectionObserver + transform）
    - リサイズ対応
~~~

---

## 期待される動作

~~~yaml
モバイル版:
  Hero: "通常スクロールで上に流れる"
  カード: |
    - 全カード同じ演出
    - 画面に入ると下から滑り込み + 軽い拡大
    - カード間の隙間は維持されるが、アニメーションでリズム感を出す

PC版:
  - 既存の sticky スタッキングがそのまま動作
  - 変更の影響なし
~~~

---

## 検証ポイント

~~~yaml
必須確認:
  1: "モバイル（900px以下）でスクロール時にカードがアニメーションするか"
  2: "PC版（900px超）で既存の sticky 動作が維持されているか"
  3: "モバイルでカード間に不自然な隙間や重なりがないか"

任意確認:
  4: "アニメーションが滑らかか（カクつきがないか）"
  5: "画面回転時のリロードが許容範囲か"
~~~
