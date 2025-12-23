# HAYAKAWA餃子 HP 追加修正計画書

## 概要

~~~yaml
対象: 変更計画書適用後のindex.html
目的: レビューで発見された問題の修正
~~~

---

## 1. フッター配置の修正

### 問題

フッターが `.wrapper` の内側に配置されているため、PC版で3カラムレイアウトになってしまっている。

### 原因

`.wrapper` は `display: flex` で横並びレイアウトを構成しており、フッターが3つ目のflex itemとして扱われた。

### 修正内容

フッターを `.wrapper` の外側に移動する。

```html
<!-- 修正前（誤り） -->
<div class="wrapper">
    <aside class="sidebar">...</aside>
    <main class="main">...</main>
    <footer class="site-footer">...</footer>  <!-- ここが問題 -->
</div>

<!-- 修正後（正しい） -->
<div class="wrapper">
    <aside class="sidebar">...</aside>
    <main class="main">...</main>
</div>
<footer class="site-footer">...</footer>  <!-- .wrapperの外に移動 -->
```

---

## 2. 画像ファイルの対応

### 方針

- 新規画像は用意せず、元テンプレートの既存画像を流用する
- 足りない分は既存画像をコピー＆リネームして枚数を確保する

### 元テンプレートの既存画像

~~~yaml
確認すべきパス:
  - image/main.jpg（ヒーロー用）
  - image/image1.jpg
  - image/image2.jpg
  - image/image3.jpg
  - image/image4.jpg
  （※実際に存在するファイルを確認すること）
~~~

### 画像マッピング

以下のように既存画像を流用する。存在しない場合は、存在する画像をコピーして作成する。

~~~yaml
hero.webp:
  対応: image/main.jpg をそのまま使用
  変更: configのheroImageを "image/main.jpg" に設定

menu-1.webp:
  対応: image/image1.jpg を使用
  変更: configのmenuItems[0].image を "image/image1.jpg" に設定

menu-2.webp:
  対応: image/image2.jpg を使用
  変更: configのmenuItems[1].image を "image/image2.jpg" に設定

menu-3.webp:
  対応: image/image3.jpg を使用
  変更: configのmenuItems[2].image を "image/image3.jpg" に設定

menu-4.webp:
  対応: image/image4.jpg を使用
  変更: configのmenuItems[3].image を "image/image4.jpg" に設定
  備考: 存在しない場合は image/image1.jpg をコピーして image/image4.jpg を作成

interior-1.webp:
  対応: image/image1.jpg を使用（または別の既存画像）
  変更: configのinteriorImage を "image/image1.jpg" に設定

owner.webp:
  対応: image/image2.jpg を使用（または別の既存画像）
  変更: configのownerImage を "image/image2.jpg" に設定
~~~

### config修正

```javascript
const config = {
    // ...
    
    // ヒーロー
    heroImage: "image/main.jpg",  // 既存画像を使用
    
    // メニュー（既存画像を流用）
    menuItems: [
        { name: "焼き餃子", price: "600円〜", image: "image/image1.jpg" },
        { name: "水餃子", price: "600円〜", image: "image/image2.jpg" },
        { name: "ランチセット", price: "900円", image: "image/image3.jpg" },
        { name: "お持ち帰り", price: "600円〜", image: "image/image4.jpg" }
    ],
    
    // 店内雰囲気（既存画像を流用）
    interiorImage: "image/image1.jpg",
    
    // オーナー（既存画像を流用）
    ownerImage: "image/image2.jpg",
    
    // ...
};
```

### 画像ファイル操作（必要な場合）

image4.jpg が存在しない場合：

```bash
# image/image1.jpg を複製して image/image4.jpg を作成
cp image/image1.jpg image/image4.jpg
```

---

## 3. 作業チェックリスト

~~~yaml
フッター修正:
  - [ ] footerタグを .wrapper の閉じタグの後ろに移動

画像対応:
  - [ ] image/ ディレクトリ内の既存画像を確認
  - [ ] configのheroImageを既存パスに変更
  - [ ] configのmenuItems各画像パスを既存パスに変更
  - [ ] configのinteriorImageを既存パスに変更
  - [ ] configのownerImageを既存パスに変更
  - [ ] 足りない画像があればコピー＆リネームで作成

動作確認:
  - [ ] PC版でフッターがページ下部に正しく表示されること
  - [ ] PC版で2カラムレイアウト（サイドバー＋メイン）が維持されていること
  - [ ] 各セクションの画像が表示されること
~~~

---

## 補足

- 本番用の画像が用意でき次第、configの画像パスを差し替えれば対応完了
- webp形式への変換も本番時に実施すればOK
