# 開発フロー

Astroプロジェクトの構築順序と開発サーバーのルール。

---

## 構築順序

```
1. front作成 ←→ GitHub Pages確認（同時進行）
   └─ 静的サイトとして見た目を作り込む
   └─ 動的部分はプレースホルダー表示

2. admin作成
   └─ Wrangler必須（KV/R2使用）
   └─ 管理画面・API実装

3. front書き換え
   └─ admin APIからコンテンツ取得する処理を追加
   └─ ADMIN_API_URL環境変数の設定

4. 連携確認
   └─ admin: localhost:8788
   └─ front: localhost:8789
   └─ frontからadminのAPIを叩いて動的コンテンツ表示

5. Cloudflareデプロイ
   └─ admin → front の順でデプロイ
   └─ 本番URLを環境変数に設定
```

---

## 開発サーバーポート規則

| プロジェクト | ポート | 起動コマンド |
|-------------|--------|-------------|
| admin | 8788（固定） | `npm run preview` |
| front | 8789（固定） | `npm run preview` |

**重要**: このポートは固定。変更してはいけない。

### package.json の設定

```json
// admin/package.json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler dev"
  }
}

// front/package.json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro build && wrangler pages dev ./dist --port 8789"
  }
}
```

---

## なぜ npm run dev を使わないのか

開発時は `npm run dev` ではなく `npm run preview`（Wrangler）を使用する。

### 理由

1. **Cloudflareサービスのエミュレート**
   - KV（セッション管理）がローカルで動作
   - R2（画像保存）がローカルで動作
   - `npm run dev` ではこれらが使えない

2. **本番環境との一致**
   - Wranglerは本番（Cloudflare Workers）と同じ環境
   - 環境差異によるバグを事前に発見できる

3. **ポートの一貫性**
   - admin=8788, front=8789 で常に固定
   - 混乱を防ぎ、設定ミスを減らす

### 各フェーズでの使い分け

| フェーズ | front | admin |
|----------|------|-------|
| front単体開発 | Wrangler 8789 | - |
| admin開発 | - | Wrangler 8788（必須） |
| 連携確認 | Wrangler 8789 | Wrangler 8788 |
| 本番 | Cloudflare | Cloudflare |

---

## モード別の制約

| 項目 | ホットリロード (4321/4322) | Wrangler (8788/8789) |
|------|--------------------------|---------------------|
| HMR（即時反映） | ✅ あり | ❌ なし（再起動必要） |
| KV/R2 | ❌ 動作しない | ✅ 動作する |
| admin API連携 | ❌ 不可（.dev.varsが読まれない） | ✅ 可能 |
| 用途 | UI/CSS調整 | API連携テスト |

### 「連携できない」場合のチェックポイント

1. ポート番号を確認 → 4321/4322ならホットリロードモード
2. ホットリロードモードでは連携は設計上不可能
3. Wranglerモードに切り替える（front:8788, admin:8789）

---

## front単体開発時の動作

adminが起動していない場合、frontは以下のように動作する：

1. admin API (`http://localhost:8788`) への接続が失敗
2. フォールバック値（空文字）が使用される
3. セクションでは `placeholder.webp` が表示される

これは**正常な動作**であり、「準備中」表示の確認にもなる。

---

## 環境変数

### Wranglerの環境変数の仕組み

| ファイル | 用途 | 本番に含まれる |
|----------|------|---------------|
| `wrangler.jsonc` の vars | **本番用** | ✅ Yes |
| `.dev.vars` | **ローカル開発用** | ❌ No |

**重要**: `wrangler.jsonc` の `vars` は本番にもデプロイされる。ローカル専用の値は `.dev.vars` に書く。

### front側の PUBLIC_ADMIN_API_URL

frontがadmin APIからコンテンツを取得するためのURL。
**クライアントサイドで使用するため `PUBLIC_` プレフィックスが必要。**

| 環境 | 設定ファイル | 値 |
|------|-------------|---|
| ローカル開発 | `.dev.vars` | `http://localhost:8789` |
| 本番 | `wrangler.jsonc` | `https://settei.{DOMAIN}` |

#### front/wrangler.jsonc（本番用）

```jsonc
{
  "vars": {
    "PUBLIC_ADMIN_API_URL": "https://settei.example.com"
  }
}
```

#### front/.dev.vars（ローカル用）

```
# ローカル開発用環境変数
# このファイルは .gitignore に含まれ、本番にはデプロイされない

PUBLIC_ADMIN_API_URL=http://localhost:8789
```

### admin側の SITE_URL

adminのフッター「サイトを見る」リンク用。

| 環境 | 設定ファイル | 値 |
|------|-------------|---|
| ローカル開発 | `.dev.vars` | `http://localhost:8788` |
| 本番 | `wrangler.jsonc` | `https://example.com` |

#### admin/wrangler.jsonc（本番用）

```jsonc
{
  "vars": {
    "SITE_URL": "https://example.com"
  }
}
```

#### admin/.dev.vars（ローカル用）

```
# ローカル開発用環境変数
SITE_URL=http://localhost:8788
ADMIN_PASSWORD=開発用パスワード
```

### admin側の画像URL生成

adminのAPIが返す画像URLは、`request.url` から動的に生成される：

```typescript
const baseUrl = new URL(request.url).origin;
// ローカル: http://localhost:8788
// 本番: https://settei.example.com
```

このため、画像URLの環境変数設定は不要。

### .gitignore

`.dev.vars` は機密情報を含む可能性があるため、`.gitignore` に含めること：

```
.dev.vars
```

---

## サーバー起動方法

**【重要】chrome-check スキルを使用すること**

```
「Astro開いて」
「adminを起動して」
「frontをDevToolsで確認」
```

直接 `npm run dev` や `npm run preview` を実行してはいけない。
chrome-checkスキルがポートの管理とブラウザ連携を行う。

---

## 関連ドキュメント

- `operations.md` - Front/Admin連携の詳細
- chrome-checkスキル - サーバー起動フロー
