/**
 * サイト設定（フロント用マスター）
 *
 * SEO・店舗情報など、公開サイトに必要な設定を一元管理。
 * 新規HP作成時はこのファイルの値を変更する。
 */

// ==========================================
// サイト基本情報
// ==========================================
export const SITE = {
  name: "HAYAKAWA",
  url: "https://hayakawa-gyoza.com",
  locale: "ja_JP",
} as const;

// ==========================================
// SEO設定
// ==========================================
export const SEO = {
  title: "HAYAKAWA｜一口餃子専門店",
  description: "長野県飯田市の手作り餃子専門店。厳選素材を使用した自慢の餃子をお届けします。",
  keywords: [
    "HAYAKAWA",
    "一口餃子",
    "餃子専門店",
    "飯田市 餃子",
    "長野県 餃子",
    "手作り餃子",
    "テイクアウト餃子",
  ],
  ogImage: "/images/ogp.webp",
} as const;

// ==========================================
// 店舗情報（JSON-LD・Shop.astro共用）
// ==========================================
export const BUSINESS = {
  name: "HAYAKAWA",
  description: "長野県飯田市の一口餃子専門店",
  telephone: "050-8885-3753",
  address: {
    postalCode: "395-0031",
    region: "長野県",
    locality: "飯田市",
    street: "仲ノ町353-10",
    // 完全な住所文字列（表示用）
    full: "長野県飯田市仲ノ町353-10",
  },
  geo: {
    latitude: 35.5145,
    longitude: 137.8214,
  },
  hours: {
    display: "11:00 - 16:00（L.o.15:45）",
    days: "月・水・金・土",
    schema: "Mo,We,Fr,Sa 11:00-16:00", // JSON-LD用
  },
  priceRange: "¥",
  servesCuisine: "餃子",
  links: {
    reservation: "https://book.squareup.com/appointments/7fdtqzj51090mo/location/LY0JN74T6NBHG/services",
    map: "https://maps.app.goo.gl/nzqpWmvyuoDS8iPu8",
    instagram: "https://www.instagram.com/hayakawa_gyoza/",
  },
} as const;

// ==========================================
// JSON-LD生成（LocalBusiness/Restaurant）
// ==========================================
export function generateJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: SITE.url,
    telephone: BUSINESS.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: "JP",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Wednesday", "Friday", "Saturday"],
      opens: "11:00",
      closes: "16:00",
    },
    priceRange: BUSINESS.priceRange,
    servesCuisine: BUSINESS.servesCuisine,
    sameAs: [BUSINESS.links.instagram],
  };
}

// ==========================================
// OGPデフォルト値（API取得失敗時のフォールバック）
// ==========================================
export const DEFAULT_OGP = {
  title: SEO.title,
  description: SEO.description,
  imageUrl: SEO.ogImage,
  updatedAt: "",
} as const;
