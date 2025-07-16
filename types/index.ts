import React from 'react';

// 用户相关类型
export interface IUser {
  id: string;
  email: string;
  credits: number;
  totalUsed: number;
  videosGenerated: number;
  isActive: boolean;
  plan: 'free' | 'premium';
  // 邮件验证相关字段
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: string;
  // 密码重置相关字段
  passwordResetToken?: string;
  passwordResetExpiresAt?: string;
  // OAuth相关字段
  googleId?: string;
  lineId?: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google' | 'line';
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUserSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: string;
}

// 视频相关类型
export interface IVideo {
  id: string;
  userId: string;
  originalPrompt: string;
  translatedPrompt: string;
  taskId: string;
  status: VideoStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  creditsUsed: number;
  errorMessage?: string;
  // 过期管理
  kieAiExpiresAt?: string;
  localExpiresAt?: string;
  storageStatus?: 'kie_ai_only' | 'local_backup' | 'expired';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 翻译相关类型
export interface ITranslation {
  originalPrompt: string;
  translatedPrompt: string;
  dialogues: IDialogue[];
  translationTime: number;
}

export interface IDialogue {
  original: string;
  translated: string;
  romaji: string;
  position: {
    start: number;
    end: number;
  };
}

export interface ITranslationCache {
  id: string;
  originalText: string;
  translatedText: string;
  dialogueInfo: IDialogue[] | null;
  hash: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// 支付相关类型
export interface IPayment {
  id: string;
  userId: string;
  orderId: string;
  transactionId?: string;
  paymentMethod: PaymentMethod;
  packageId: string;
  amount: number;
  currency: string;
  creditsPurchased: number;
  status: PaymentStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type PaymentMethod = 'stripe' | 'paypay';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface ICreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  discount: number;
  isPopular?: boolean;
}

// API响应类型
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: IApiError;
  message?: string;
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 常见错误代码
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  TRANSLATION_FAILED: 'TRANSLATION_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR'
} as const;

// 表单类型
export interface ILoginForm {
  email: string;
  password: string;
}

export interface IRegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface IVideoGenerationForm {
  originalPrompt: string;
  imageUrls?: string[];
  seed?: string; // 添加seed支持
}

// 配置类型
export interface IAppConfig {
  maxPromptLength: number;
  maxImageSize: number;
  supportedImageFormats: string[];
  creditPackages: ICreditPackage[];
}

// KIE.AI API类型
export interface IKieAiGenerateRequest {
  prompt: string;
  imageUrls?: string[];
  model?: 'veo3_fast' | 'veo3_quality'; // 支持官方模型名稱
  seed?: string; // 添加seed参数支持
}

export interface IKieAiGenerateResponse {
  taskId: string;
  status: string;
  estimatedTime?: number;
}

export interface IKieAiStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    paramJson: string;
    response: {
      taskId: string;
      originUrls: string[] | null;
      resultUrls: string[];
      seeds: number[];
    };
    successFlag: 0 | 1; // 0: 处理中/失败, 1: 成功
    completeTime: number;
    createTime: number;
    errorCode: string | null;
    errorMessage: string | null;
  };
}

// OpenAI API类型
export interface IOpenAiTranslateRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  includeRomaji?: boolean;
}

export interface IOpenAiTranslateResponse {
  translatedText: string;
  dialogues?: IDialogue[];
  confidence?: number;
}

// 实用类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 分页类型
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: IPagination;
}

// 环境变量类型
export interface IEnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  KIE_AI_API_KEY: string;
  KIE_AI_BASE_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

// 组件Props类型
export interface IComponentProps {
  children?: React.ReactNode;
  className?: string;
}

// 页面参数类型
export interface IPageParams {
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
}

// 状态管理类型
export interface IAppState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  credits: number;
  videos: IVideo[];
  currentVideo: IVideo | null;
}

// 事件类型
export interface IVideoGenerationEvent {
  type: 'start' | 'progress' | 'complete' | 'error';
  data: {
    taskId: string;
    progress?: number;
    videoUrl?: string;
    errorMessage?: string;
  };
}

// 通知类型
export interface INotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
  createdAt: string;
}

// 统计类型
export interface IUserStats {
  totalVideosGenerated: number;
  totalCreditsUsed: number;
  totalCreditsRemaining: number;
  averageGenerationTime: number;
  registrationDate: string;
}

// 导出默认配置
export const DEFAULT_CONFIG: IAppConfig = {
  maxPromptLength: 6000,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  creditPackages: [
    {
      id: 'starter',
      name: '入门包',
      credits: 1000,
      price: 980,
      currency: 'JPY',
      discount: 0
    },
    {
      id: 'standard',
      name: '标准包',
      credits: 3000,
      price: 2580,
      currency: 'JPY',
      discount: 12,
      isPopular: true
    },
    {
      id: 'pro',
      name: '专业包',
      credits: 10000,
      price: 7800,
      currency: 'JPY',
      discount: 20
    }
  ]
}; 

// 图片上传相关类型
export interface IUploadedImage {
  uid: string;
  name: string;
  url: string;
  file?: File;
}

export interface IImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
} 