# 運用・ホスティング設定

---

## リポジトリ構成

プロジェクトは以下の2ディレクトリで構成される：

| ディレクトリ | 役割 | ビルド方式 |
|-------------|------|-----------|
| `site/` | 本体サイト（公開用HP） | Astro 静的ビルド |
| `admin/` | 管理画面（クライアント専用） | Astro SSR |

### 分離の理由

- **セキュリティ**: 管理画面のコードが公開サイトに含まれない
- **デプロイ独立性**: 本体と管理画面を別々に更新可能
- **認証設計**: SSRでサーバーサイド認証を実現

---

## Cloudflare構成

### 使用サービス一覧

| サービス | 用途 | 設定場所 |
|---------|------|---------|
| **Pages** | 静的サイトホスティング（site/） | ダッシュボード or wrangler.toml |
| **Workers** | SSR実行（admin/） | Astro Adapter経由で自動生成 |
| **R2** | 画像ストレージ | wrangler.toml でバインド |
| **KV** | セッション管理 | wrangler.toml でバインド |

### デプロイフロー

```
site/  → npm run build → Cloudflare Pages（静的）
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
├── hayakawa-site（Pages - 静的）
├── hayakawa-admin（Pages + Workers - SSR）
├── clientB-site
├── clientB-admin
└── ...
```

### 命名規則

- `{client}-site`: 本体サイト
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

### wrangler.toml での設定

```toml
[vars]
ADMIN_USER = "hayakawa"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "hayakawa-images"

[[kv_namespaces]]
binding = "SESSIONS"
id = "xxxxx"
```

### 秘密情報

パスワードなどは `wrangler secret put` で設定：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

---

## Site/Admin連携

### 連携の仕組み

```
site (SSG) ──GET───→ admin/api/public/content (CORS対応)
                           ↓
                     R2からJSON取得
                           ↓
                     画像URLをフルパスに変換して返却
```

- **site側**: ビルド時に admin API からコンテンツを取得
- **admin側**: `/api/public/content` が認証なしで公開データを返す

### Site側の実装

```typescript
// site/src/lib/content.ts
import { fetchContentSafe } from '../lib/content';

// Astroページ内で使用
const content = await fetchContentSafe('https://your-admin.pages.dev');

if (content?.calendar) {
  // カレンダー画像を表示
}
```

### Admin側の実装

`admin/src/pages/api/public/content.ts`:

1. CORS許可ドメインを設定
2. R2からコンテンツJSONを取得
3. 画像URLをフルパスに変換
4. JSONレスポンスを返す

### 開発環境での連携

```bash
# ターミナル1: admin を起動
cd admin && npm run dev  # localhost:4321

# ターミナル2: site を起動（別ポート）
cd site && npm run dev -- --port 4322
```

site から admin の API を呼び出す際、CORS設定に `localhost:4322` を追加。

### ビルド時の動作

site のビルド時（`npm run build`）に admin API からコンテンツを取得する場合:

```javascript
// astro.config.mjs
export default defineConfig({
  // ビルド時の環境変数でadminのURLを指定
  vite: {
    define: {
      'import.meta.env.ADMIN_URL': JSON.stringify(
        process.env.ADMIN_URL || 'http://localhost:4321'
      )
    }
  }
});
```

### デプロイ時の注意

1. **admin を先にデプロイ** - site のビルド時に admin API が必要
2. **CORS設定を更新** - 本番ドメインを許可リストに追加
3. **環境変数を設定** - Cloudflare Pages のビルド設定で `ADMIN_URL` を設定

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
// site/src/lib/content.ts

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

- `site/public/placeholder.webp` に汎用プレースホルダー画像を1枚配置
- 全てのセクションで共通利用
- 「画像準備中」等の意味が伝わるシンプルなデザインを推奨

---

## 関連ドキュメント

- [Cloudflare Pages公式](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
