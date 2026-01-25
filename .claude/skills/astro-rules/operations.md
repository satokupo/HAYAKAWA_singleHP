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

## 関連ドキュメント

- [Cloudflare Pages公式](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)
