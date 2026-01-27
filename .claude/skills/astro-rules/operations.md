# 運用・ホスティング設定

---

## リポジトリ構成

プロジェクトは以下の2ディレクトリで構成される：

| ディレクトリ | 役割 | ビルド方式 |
|-------------|------|-----------|
| `front/` | 本体サイト（公開用HP） | Astro SSG + クライアントfetch |
| `admin/` | 管理画面（クライアント専用） | Astro SSR（Workers上で動作） |

### 分離の理由

- **セキュリティ**: 管理画面のコードが公開サイトに含まれない
- **デプロイ独立性**: 本体と管理画面を別々に更新可能
- **認証設計**: SSRでサーバーサイド認証を実現

---

## 設計思想

### 基本方針: 静的ベース + クライアントfetch

本番環境の構成:
```
ユーザー → front (Pages/静的HTML) → ブラウザJS → admin API (Workers)
                                                      ↓
                                                 R2から画像・コンテンツ取得
```

- **front**: 静的HTML（SSG）として配信
- **動的コンテンツ**（カレンダー、限定メニュー）: クライアントサイドでadmin APIからfetch
- **admin**: SSR（Workers上で動作、KV/R2を使用）

### この設計のメリット

1. **高速な初期表示**: 静的HTMLはCDNキャッシュが効く
2. **SEO**: 静的部分は検索エンジンに最適
3. **Cloudflare無料枠の節約**: frontのWorkersリクエストがゼロ
4. **リアルタイム更新**: adminで変更した内容が即座にfrontに反映
5. **API通信の効率化**: 動的コンテンツは1回のfetchでまとめて取得

### Workersリクエスト比較

| 方式 | front | admin | 合計/アクセス |
|-----|-------|-------|--------------|
| 全SSR | 1回 | 1回 | 2回 |
| 静的+クライアントfetch | 0回 | 1回 | 1回 |

---

## Cloudflare構成

### 使用サービス一覧

| サービス | 用途 | 設定場所 |
|---------|------|---------|
| **Pages** | 静的配信（front） | ダッシュボード or wrangler.toml |
| **Workers** | SSR（admin） | Astro Adapter経由で自動生成 |
| **R2** | 画像ストレージ | wrangler.toml でバインド |
| **KV** | セッション管理 | wrangler.toml でバインド |

### デプロイフロー

```
front/ → npm run build → Cloudflare Pages（静的）
admin/ → npm run build → Cloudflare Pages + Workers（SSR）
```

---

## Astro SSR + Cloudflare Adapter

### 重要: workersディレクトリは不要

Astro + Cloudflare Adapterを使う場合、**workersディレクトリを手動で作成する必要はない**。

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});
```

ビルド時に `dist/_worker.js` が自動生成され、Cloudflare Pagesにデプロイするとそのまま動く。

### ローカル開発

```bash
# wrangler dev でローカル確認（Docker不要）
npx wrangler pages dev ./dist
```

R2やKVもローカルでエミュレートされる。

---

## 無料枠と運用規模

### Cloudflare無料枠（2024年時点）

| サービス | 無料枠 |
|---------|--------|
| Pages | 500ビルド/月、無制限帯域 |
| Workers | 10万リクエスト/日 |
| R2 | 10GB保存、100万クラスA/月、1000万クラスB/月 |
| KV | 10万読み取り/日、1000書き込み/日 |

### 運用規模の目安

- **20〜30サイトまで**: 無料枠で運用可能
- **10サイト超えたら**: $5/月の有料プラン検討
- **判断基準**: Workersリクエスト数とR2容量を監視

### 有料プラン移行タイミング

1. Workersリクエストが日10万に近づいた
2. R2容量が8GB超えた
3. KV書き込みが頻繁に上限に達する

---

## 複数クライアント運用

### 1アカウントでの管理

Cloudflareは1アカウントで複数プロジェクトを管理できる：

```
Cloudflareアカウント
├── hayakawa-front（Pages - 静的）
├── hayakawa-admin（Pages + Workers - SSR）
├── clientB-front
├── clientB-admin
└── ...
```

### 命名規則

- `{client}-front`: 本体サイト
- `{client}-admin`: 管理画面

### リソース共有の注意点

- **R2バケット**: クライアントごとに分ける（`hayakawa-images`, `clientB-images`）
- **KV名前空間**: クライアントごとに分ける（セッション分離）
- **カスタムドメイン**: クライアントごとに設定

---

## キャッシュ対策

### 画像更新時のキャッシュ問題

クライアントが画像を更新しても、CDNキャッシュで古い画像が表示される問題への対策。

### クエリストリング方式

```html
<img src="/images/calendar.webp?v=1706234567" alt="カレンダー">
```

### metadata.jsonでバージョン管理

```json
{
  "calendar": {
    "version": 1706234567,
    "updatedAt": "2024-01-26T10:22:47Z"
  },
  "limitedMenu": {
    "version": 1706234500,
    "title": "1月限定メニュー",
    "description": "旬の素材を使った...",
    "updatedAt": "2024-01-26T10:21:40Z"
  }
}
```

SSRでmetadata.jsonを読み込み、動的にバージョンパラメータを付与する。

---

## 環境変数

### 環境変数ファイルの使い分け

| ファイル | 用途 | 本番に含まれる |
|----------|------|---------------|
| `wrangler.jsonc` の vars | **本番用** | ✅ Yes |
| `.dev.vars` | **ローカル開発用** | ❌ No |

**重要**: `wrangler.jsonc` の `vars` は本番にもデプロイされる。ローカル専用の値は `.dev.vars` に書く。

### wrangler.jsonc での設定（本番用）

```jsonc
{
  "vars": {
    "ADMIN_API_URL": "https://<ADMIN_DOMAIN>"
  },
  "r2_buckets": [
    { "binding": "IMAGES", "bucket_name": "hayakawa-images" }
  ],
  "kv_namespaces": [
    { "binding": "SESSIONS", "id": "<KV_ID>" }
  ]
}
```

### .dev.vars での設定（ローカル用）

```
# ローカル開発用環境変数
ADMIN_API_URL=http://localhost:8788
ADMIN_PASSWORD=開発用パスワード
```

このファイルは `.gitignore` に含め、リポジトリにコミットしない。

### 秘密情報（本番用）

パスワードなどは `wrangler secret put` で設定：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

Secrets は Cloudflare ダッシュボードでも設定可能。

---

## Front/Admin連携

### 連携の仕組み

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

- **front側**: クライアントサイド（ブラウザ）で admin API からコンテンツを取得
- **admin側**: `/api/public/content` が認証なしで公開データを返す
- **ポイント**: ビルド時ではなく、ユーザーがページを開いた時にfetchが実行される

### API設計: 一括取得方式

動的コンテンツ（カレンダー、限定メニュー、OGP等）は**1回のAPI通信でまとめて取得**する設計。

| 方式 | API呼び出し回数 | 欠点 |
|------|----------------|------|
| フィールドごとに個別API | N回 | 通信オーバーヘッド大、レイテンシ増加 |
| **一括取得（採用）** | **1回** | シンプル、高速、Workersリクエスト節約 |

```typescript
// admin API: Promise.allで並列取得し、1つのJSONで返却
const [calendar, limited, ogp] = await Promise.all([
  getContent(env, 'calendar'),
  getContent(env, 'limited'),
  getContent(env, 'ogp'),
]);
return { calendar, limited, ogp };
```

**ポイント**: 新しい動的コンテンツを追加する場合も、個別APIを作らず既存の `/api/public/content` に追加する。

### Front側の実装

```typescript
// front/src/components/DynamicContent.astro のスクリプト部分
// クライアントサイドで実行される

async function fetchContent() {
  const response = await fetch('https://your-admin.pages.dev/api/public/content');
  const data = await response.json();

  if (data?.calendar) {
    // カレンダー画像を表示
  }
}

// ページ読み込み時に実行
fetchContent();
```

### Admin側の実装

`admin/src/pages/api/public/content.ts`:

1. CORS許可ドメインを設定
2. R2からコンテンツJSONを取得
3. 画像URLをフルパスに変換
4. JSONレスポンスを返す

### 開発環境での連携

```bash
# ターミナル1: admin を起動（Wrangler）
cd admin && npm run preview  # localhost:8788

# ターミナル2: front を起動（Wrangler）
cd front && npm run preview   # localhost:8789
```

**重要**: `npm run dev` ではなく `npm run preview`（Wrangler）を使用すること。
KV/R2がローカルでエミュレートされ、本番と同じ環境でテストできる。

front から admin の API を呼び出す際、CORS設定に `localhost:8789` を追加。

### CORS許可ドメインの設定

`admin/src/pages/api/public/content.ts` で許可ドメインを設定：

```typescript
const allowedOrigins = [
  'http://localhost:8789',       // ローカル開発（front）
  'https://example.com',         // 本番ドメイン
  'https://www.example.com',     // 本番ドメイン（wwwあり）
];
```

**注意**: 新しいクライアントを追加する際は、本番ドメインをこのリストに追加すること。

### デプロイ時の注意

1. **CORS設定を更新** - 本番ドメインを許可リストに追加
2. **デプロイ順序は任意** - frontとadminは独立してデプロイ可能（クライアントfetchのため依存関係なし）

---

## 動的コンテンツのデフォルト値

### 基本原則

Admin APIからSSRで取得するコンテンツ（カレンダー、限定メニュー等）には、**サンプルコンテンツをデフォルト値に入れてはいけない**。

### 理由

1. API失敗時に古い/間違ったコンテンツが表示される
2. ユーザーが「更新したのに変わらない」と混乱する
3. テスト環境と本番環境で挙動が異なる原因になる

### 推奨パターン

```typescript
// front/src/lib/content.ts

export const DEFAULT_LIMITED: LimitedMenuContent = {
  title: '',           // 空文字
  description: '',     // 空文字
  imageUrl: '',        // 空文字（セクションでplaceholder.webpにフォールバック）
  updatedAt: '',
};

export const DEFAULT_CALENDAR: CalendarContent = {
  imageUrl: '',        // 空文字（セクションでplaceholder.webpにフォールバック）
  month: '',
  updatedAt: '',
};
```

### セクション側の実装

```astro
---
// 04-Limited.astro
import { fetchContent, DEFAULT_LIMITED } from '../lib/content';

const baseUrl = import.meta.env.BASE_URL;
const { limited } = await fetchContent(adminApiUrl);

// imageUrlが空の場合はplaceholder.webpを使用
const imageUrl = limited?.imageUrl || `${baseUrl}placeholder.webp`;
---
```

### プレースホルダー画像

- `front/public/placeholder.webp` に汎用プレースホルダー画像を1枚配置
- 全てのセクションで共通利用
- 「画像準備中」等の意味が伝わるシンプルなデザインを推奨

---

## 関連ドキュメント

- [Cloudflare Pages公式](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
