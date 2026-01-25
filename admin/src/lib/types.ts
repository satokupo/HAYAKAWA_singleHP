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
  /** 画像の用途（calendar | limited） */
  type: 'calendar' | 'limited';
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
 * 限定メニューコンテンツ
 */
export interface LimitedMenuContent {
  /** タイトル */
  title: string;
  /** 説明文 */
  description: string;
  /** 画像URL */
  imageUrl: string;
  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
}

/**
 * カレンダーコンテンツ
 */
export interface CalendarContent {
  /** 画像URL */
  imageUrl: string;
  /** 対象年月（YYYY-MM形式） */
  month: string;
  /** 最終更新日時（ISO 8601） */
  updatedAt: string;
}

/**
 * API レスポンス共通型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
