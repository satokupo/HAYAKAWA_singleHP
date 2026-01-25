/**
 * Cloudflare Bindings
 * wrangler.jsonc で定義されたバインディングの型定義
 */
export interface Env {
  // KV Namespaces
  SESSIONS: KVNamespace;
  RATE_LIMIT: KVNamespace;

  // R2 Bucket
  IMAGES: R2Bucket;

  // Environment Variables
  ADMIN_ID: string;
  ADMIN_PASSWORD: string;
  SESSION_TTL: string;
}

/**
 * セッションデータ
 */
export interface SessionData {
  /** セッションID */
  id: string;
  /** 作成日時（Unix timestamp） */
  createdAt: number;
  /** 有効期限（Unix timestamp） */
  expiresAt: number;
  /** ユーザーエージェント（追加検証用） */
  userAgent?: string;
}

/**
 * レート制限データ
 */
export interface RateLimitData {
  /** 直近のアクセス試行時刻（Unix timestamp配列） */
  attempts: number[];
  /** ブロック状態 */
  blocked?: boolean;
  /** ブロック解除時刻（Unix timestamp） */
  blockedUntil?: number;
}

/**
 * 認証リクエスト
 */
export interface AuthRequest {
  id: string;
  password: string;
}

/**
 * 認証レスポンス
 */
export interface AuthResponse {
  success: boolean;
  message?: string;
  /** エラーの場合のリトライ可能時刻（Unix timestamp） */
  retryAfter?: number;
}

/**
 * 画像アップロードリクエスト
 */
export interface ImageUploadRequest {
  /** 画像の用途（プロジェクトに応じてカスタマイズ） */
  type: string;
  /** 元のファイル名 */
  filename: string;
}

/**
 * 画像アップロードレスポンス
 */
export interface ImageUploadResponse {
  success: boolean;
  /** アップロード後のURL */
  url?: string;
  /** エラーメッセージ */
  message?: string;
}

/**
 * API レスポンス共通型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// 以下はプロジェクト固有のコンテンツ型
// プロジェクトに応じてカスタマイズしてください
// ============================================================

/**
 * コンテンツ例: カレンダー
 * TODO: プロジェクトに応じて変更
 */
export interface CalendarContent {
  imageUrl: string;
  month: string;
  updatedAt: string;
}

/**
 * コンテンツ例: 限定メニュー
 * TODO: プロジェクトに応じて変更
 */
export interface LimitedMenuContent {
  title: string;
  description: string;
  imageUrl: string;
  updatedAt: string;
}
