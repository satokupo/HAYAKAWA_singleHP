# Front/Admin API連携

frontとadminの連携方法、CORS設定、API設計について。

---

> **WARNING: 「ステージング」という概念は使わない**
>
> Cloudflare Pagesの「デフォルトドメイン」（`*.pages.dev`）と「カスタムドメイン」は、
> **同じデプロイ先を参照している**。
>
> つまり、デフォルトドメインは「ステージング環境」ではなく、
> 単なる別名（エイリアス）にすぎない。
>
> 環境は **ローカル** と **本番** の2つのみ。

---

## 連携の仕組み

### 全体フロー

```
ユーザー → front (静的HTML) → ブラウザでJS実行
                                    ↓
                              クライアントサイドでfetch
                                    ↓
                        admin/api/public/content (CORS対応)
                                    ↓
                              R2からJSON取得
                                    ↓
                        画像URLをフルパスに変換して返却
```

### ポイント

- **front側**: クライアントサイド（ブラウザ）で admin API からコンテンツを取得
- **admin側**: `/api/public/content` が認証なしで公開データを返す
- **タイミング**: ビルド時ではなく、ユーザーがページを開いた時にfetchが実行される

### なぜクライアントサイドfetchなのか

| 方式 | front | admin | 合計/アクセス |
|-----|-------|-------|--------------|
| 全SSR | 1回 | 1回 | 2回 |
| 静的+クライアントfetch | 0回 | 1回 | 1回 |

**メリット:**
1. **高速な初期表示**: 静的HTMLはCDNキャッシュが効く
2. **SEO**: 静的部分は検索エンジンに最適
3. **Cloudflare無料枠の節約**: frontのWorkersリクエストがゼロ
4. **リアルタイム更新**: adminで変更した内容が即座にfrontに反映

---

## 環境別API URLマッピング

> **2環境のみ: ローカルと本番**

| 環境 | front URL | admin API URL |
|------|-----------|---------------|
| **ローカル** | `http://localhost:8789` | `http://localhost:8788` |
| **本番** | `https://example.com` | `https://settei.example.com` |

### 設定ファイル

#### front側

**front/wrangler.jsonc（本番用）:**
```jsonc
{
  "vars": {
    "PUBLIC_ADMIN_API_URL": "https://settei.example.com"
  }
}
```

**front/.dev.vars（ローカル用）:**
```
PUBLIC_ADMIN_API_URL=http://localhost:8788
```

#### admin側

**admin/wrangler.jsonc（本番用）:**
```jsonc
{
  "vars": {
    "SITE_URL": "https://example.com"
  }
}
```

**admin/.dev.vars（ローカル用）:**
```
SITE_URL=http://localhost:8789
```

---

## CORS許可ドメイン設定

### 設定場所

`admin/src/pages/api/public/content.ts`（または該当するAPIファイル）

### 設定例

```typescript
const allowedOrigins = [
  // ローカル開発
  'http://localhost:8789',

  // 本番ドメイン
  'https://example.com',
  'https://www.example.com',
];
```

### 注意事項

1. **新しいクライアントを追加する際は、本番ドメインをこのリストに追加すること**
2. デフォルトドメイン（`*.pages.dev`）は本番ドメインと同じデプロイ先なので、特別な設定は不要
3. `http://localhost:8789` はローカル開発用（本番には影響しない）

### CORSヘッダーの実装例

```typescript
export async function GET({ request }: { request: Request }) {
  const origin = request.headers.get('Origin');

  const allowedOrigins = [
    'http://localhost:8789',
    'https://example.com',
    'https://www.example.com',
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  // ... データ取得処理

  return new Response(JSON.stringify(data), { headers });
}
```

---

## API設計: 一括取得方式

動的コンテンツ（カレンダー、限定メニュー、OGP等）は**1回のAPI通信でまとめて取得**する設計。

### なぜ一括取得か

| 方式 | API呼び出し回数 | 欠点 |
|------|----------------|------|
| フィールドごとに個別API | N回 | 通信オーバーヘッド大、レイテンシ増加 |
| **一括取得（採用）** | **1回** | シンプル、高速、Workersリクエスト節約 |

### Admin側の実装

```typescript
// admin/src/pages/api/public/content.ts

export async function GET({ request, locals }: APIContext) {
  const env = locals.runtime.env;

  // Promise.allで並列取得し、1つのJSONで返却
  const [calendar, limited, ogp] = await Promise.all([
    getContent(env, 'calendar'),
    getContent(env, 'limited'),
    getContent(env, 'ogp'),
  ]);

  return new Response(JSON.stringify({
    calendar,
    limited,
    ogp,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### Front側の実装

```typescript
// front/src/components/DynamicContent.astro のスクリプト部分
// クライアントサイドで実行される

async function fetchContent() {
  const apiUrl = import.meta.env.PUBLIC_ADMIN_API_URL;
  const response = await fetch(`${apiUrl}/api/public/content`);
  const data = await response.json();

  if (data?.calendar) {
    // カレンダー画像を表示
  }

  if (data?.limited) {
    // 限定メニューを表示
  }
}

// ページ読み込み時に実行
fetchContent();
```

### 新しい動的コンテンツを追加する場合

**個別APIを作らず、既存の `/api/public/content` に追加する。**

```typescript
// 新しいコンテンツを追加する場合
const [calendar, limited, ogp, newContent] = await Promise.all([
  getContent(env, 'calendar'),
  getContent(env, 'limited'),
  getContent(env, 'ogp'),
  getContent(env, 'new-content'),  // 追加
]);
```

---

## 開発環境での連携確認

### 起動手順

```bash
# ターミナル1: admin を起動（Wrangler）
cd admin && npm run preview  # localhost:8788

# ターミナル2: front を起動（Wrangler）
cd front && npm run preview   # localhost:8789
```

**重要**: `npm run dev` ではなく `npm run preview`（Wrangler）を使用すること。
KV/R2がローカルでエミュレートされ、本番と同じ環境でテストできる。

### 連携確認のチェックリスト

- [ ] admin が `localhost:8788` で起動している
- [ ] front が `localhost:8789` で起動している
- [ ] front の `.dev.vars` に `PUBLIC_ADMIN_API_URL=http://localhost:8788` が設定されている
- [ ] admin の CORS設定に `http://localhost:8789` が含まれている
- [ ] ブラウザのコンソールにCORSエラーが出ていない

---

## デプロイ時の注意

1. **CORS設定を更新** - 本番ドメインを許可リストに追加
2. **デプロイ順序は任意** - frontとadminは独立してデプロイ可能（クライアントfetchのため依存関係なし）
3. **環境変数の確認** - `wrangler.jsonc` に本番URLが正しく設定されているか確認

---

## トラブルシューティング

### CORSエラーが発生する

1. admin の CORS許可リストに front のドメインが含まれているか確認
2. `Origin` ヘッダーが正しく送信されているか確認（ブラウザのDevToolsで確認）
3. プリフライトリクエスト（OPTIONS）が処理されているか確認

### データが取得できない

1. admin API が正しく動作しているか確認（直接アクセスしてみる）
2. front の `PUBLIC_ADMIN_API_URL` が正しいか確認
3. R2 にデータが保存されているか確認

### ローカルで連携できない

1. ポート番号を確認 → 4321/4322ならホットリロードモード
2. ホットリロードモード（`npm run dev`）では `.dev.vars` が読まれない
3. Wranglerモード（`npm run preview`）に切り替える

---

## 関連ドキュメント

- `workflow.md` - 開発サーバーの起動方法
- operations.md - 運用・ホスティング設定
