# モバイル版スタッキング実装指示書 v2

## 方針転換

PC版の `position: sticky` をモバイルで再現することを諦め、**モバイル専用の「重なり感演出UI」** を別実装する。

~~~yaml
理由:
  - モバイルで sticky が動作しない原因特定が困難
  - 原因不明のまま推測ベースで修正を繰り返すのは非効率
  - PC版に影響を与えず、モバイル専用の確実な実装を行う
~~~

---

## 現状

~~~yaml
PC版（900px超）:
  - position: sticky によるスタッキングが正常動作
  - 変更不要

モバイル版（900px以下）:
  - position: sticky は適用されているが動作しない
  - すべてのカードが分離し、隙間がある状態
~~~

---

## 実装方針

モバイル版では以下のアプローチで「重なり感」を演出する：

~~~yaml
コンセプト:
  - 既存の sticky スタイルをモバイルでは無効化
  - スクロールに応じて transform（translateY, scale）で重なり感を演出
  - IntersectionObserver でカードの表示状態を監視
  - PC版のコード・スタイルには一切影響を与えない完全分離設計
~~~

---

## 具体的な実装手順

### 手順1: モバイル判定の追加

既存のJavaScript（DOMContentLoaded内）に以下を追加：

```javascript
// モバイル判定
const isMobile = window.matchMedia('(max-width: 900px)').matches;
```

---

### 手順2: モバイル時に sticky を無効化

モバイル判定後、sticky関連スタイルを除去：

```javascript
if (isMobile) {
    // sticky を無効化
    const allStackBlocks = document.querySelectorAll('.stack-block, .sticky-card');
    allStackBlocks.forEach(block => {
        block.style.position = 'relative';
        block.style.top = 'auto';
    });
}
```

---

### 手順3: モバイル用スタッキング演出の実装

IntersectionObserver と transform を使用した重なり感演出：

```javascript
if (isMobile) {
    // 各カードの初期状態を設定
    const stackBlocks = document.querySelectorAll('.stack-block');
    
    stackBlocks.forEach((block, index) => {
        // z-index を維持（後のカードが上に来る）
        block.style.zIndex = index + 2;
        
        // トランジションを追加
        block.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    });

    // IntersectionObserver でスクロール監視
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    };

    const stackObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const block = entry.target;
            const ratio = entry.intersectionRatio;
            
            if (entry.isIntersecting) {
                // 画面内に入ってきたカード：徐々に通常位置へ
                const translateY = (1 - ratio) * 30; // 最大30px下からスライドイン
                const scale = 0.95 + (ratio * 0.05); // 0.95 → 1.0
                
                block.style.transform = `translateY(${translateY}px) scale(${scale})`;
                block.style.boxShadow = `0 ${10 - ratio * 5}px ${20 - ratio * 10}px rgba(0,0,0,${0.1 - ratio * 0.05})`;
            } else {
                // 画面外のカード：初期状態
                block.style.transform = 'translateY(30px) scale(0.95)';
            }
        });
    }, observerOptions);

    // 各ブロックを監視対象に追加
    stackBlocks.forEach(block => {
        stackObserver.observe(block);
    });
}
```

---

### 手順4: CSSの調整（モバイル用）

`@media (max-width: 900px)` 内に以下を追加・変更：

```css
@media (max-width: 900px) {
    /* 既存の .stack-block ルールを以下に置き換え */
    .stack-block {
        padding: 2rem;
        min-height: auto;
        margin-bottom: 1rem;
        width: 100%;
        box-sizing: border-box;
        position: relative; /* sticky → relative に変更 */
        /* transform はJSで制御 */
        will-change: transform, box-shadow;
    }
    
    /* 最初のカードは変形なしで表示 */
    .stack-block:first-of-type {
        transform: none !important;
    }
}
```

---

### 手順5: リサイズ対応（オプション）

画面幅が変わった場合の対応：

```javascript
// リサイズ時の再判定
let currentIsMobile = isMobile;

window.addEventListener('resize', () => {
    const newIsMobile = window.matchMedia('(max-width: 900px)').matches;
    
    if (currentIsMobile !== newIsMobile) {
        // ブレークポイントをまたいだ場合はリロード
        location.reload();
    }
});
```

---

## 完全なコード統合例

既存の `DOMContentLoaded` イベントリスナー内の末尾（スタッキング位置計算の後）に追加：

```javascript
// ===============================================
// モバイル用スタッキング演出
// ===============================================
const isMobile = window.matchMedia('(max-width: 900px)').matches;

if (isMobile) {
    // PC用のsticky設定を無効化
    const allStackBlocks = document.querySelectorAll('.stack-block, .sticky-card');
    allStackBlocks.forEach(block => {
        block.style.position = 'relative';
        block.style.top = 'auto';
        block.style.zIndex = '';
    });

    // モバイル用の演出を設定
    const stackBlocks = document.querySelectorAll('.stack-block');
    
    stackBlocks.forEach((block, index) => {
        block.style.zIndex = index + 2;
        block.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
    });

    // IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
    };

    const stackObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const block = entry.target;
            const ratio = entry.intersectionRatio;
            
            if (entry.isIntersecting) {
                const translateY = (1 - ratio) * 20;
                const scale = 0.97 + (ratio * 0.03);
                
                block.style.transform = `translateY(${translateY}px) scale(${scale})`;
                block.style.boxShadow = `0 ${8 - ratio * 4}px ${16 - ratio * 8}px rgba(0,0,0,${0.08 - ratio * 0.04})`;
            }
        });
    }, observerOptions);

    stackBlocks.forEach(block => {
        stackObserver.observe(block);
    });

    // リサイズ対応
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

CSS変更:
  箇所: "@media (max-width: 900px)" 内の .stack-block
  内容: |
    position: sticky → position: relative に変更
    will-change: transform, box-shadow を追加

JavaScript追加:
  箇所: DOMContentLoaded イベントリスナー末尾
  内容: |
    - isMobile 判定
    - sticky 無効化処理
    - IntersectionObserver による演出
    - リサイズ対応
~~~

---

## 期待される動作

~~~yaml
モバイル版:
  - スクロールで各カードが下から滑り込むように表示
  - 軽い拡大アニメーションとシャドウで奥行き感を演出
  - 完全な「重なり」ではないが、リズム感のあるスクロール体験

PC版:
  - 既存の sticky スタッキングがそのまま動作
  - 変更の影響なし
~~~

---

## 検証ポイント

~~~yaml
確認項目:
  1: "モバイル（900px以下）でカードが分離せず、スクロールに追従する演出があるか"
  2: "PC版（900px超）で既存の sticky 動作が維持されているか"
  3: "画面幅を変えた際にリロードされ、正しいモードに切り替わるか"
  4: "アニメーションが滑らかか（カクつきがないか）"
~~~
