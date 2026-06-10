export interface TokenUsageBreakdown {
  textTokens?: number;
  imageTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  /** 输入侧细分（DashScope input_tokens_details 等） */
  input?: TokenUsageBreakdown;
  /** 输出侧细分（DashScope output_tokens_details 等） */
  output?: TokenUsageBreakdown;
}

export interface SearchResultItem {
  index: number;
  title: string;
  url: string;
  site_name?: string;
  icon?: string;
}

export interface MessageAttachment {
  id: string;
  mimeType: string;
  objectKey: string;
  url: string;
  fileName?: string;
  width?: number;
  height?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[];
  reasoning?: string;
  searchResults?: SearchResultItem[];
  searchStatus?: 'searching' | 'done';
  model?: string;
  createdAt: string;
  /** 首次收到流式响应的时间戳（ISO） */
  responseStartedAt?: string;
  /** 从首次响应到生成结束的耗时（毫秒） */
  durationMs?: number;
  usage?: TokenUsage;
  aborted?: boolean;
  /** API 调用失败时的错误信息，用于展示重试 */
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modelId?: string;
  messages: Message[];
}

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modelId?: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type ProviderMode = 'dashscope' | 'openai-compatible';

export type DashScopeRegion = 'cn-beijing' | 'ap-southeast-1' | 'us-east-1';

export interface ProviderProfile {
  apiKey: string;
  availableModels: string[];
  enabledModelIds: string[];
  /** 已启用模型是否支持图片输入（在设置中编辑） */
  modelVisionById: Record<string, boolean>;
  /** 已启用模型是否支持深度思考（在设置中编辑） */
  modelThinkingById: Record<string, boolean>;
}

export interface DashScopeProfile extends ProviderProfile {
  region: DashScopeRegion;
}

export interface OpenAICompatibleProfile extends ProviderProfile {
  baseURL: string;
}

export interface ObjectStorageSettings {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  keyPrefix: string;
  usePresignedUrls: boolean;
  presignedUrlExpirySeconds: number;
}

export interface ObjectStorageSettingsPersisted {
  enabled: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  encryptedAccessKeyId: string | null;
  encryptedSecretAccessKey: string | null;
  forcePathStyle: boolean;
  publicBaseUrl: string;
  keyPrefix: string;
  usePresignedUrls: boolean;
  presignedUrlExpirySeconds: number;
}

export interface AppSettings {
  providerMode: ProviderMode;
  dashscope: DashScopeProfile;
  openaiCompatible: OpenAICompatibleProfile;
  objectStorage: ObjectStorageSettings;
  theme: ThemeMode;
  /** 是否开启深度思考（enable_thinking） */
  enableThinking: boolean;
  /** 是否开启联网搜索（enable_search） */
  enableSearch: boolean;
}

export interface ProviderProfilePersisted {
  encryptedApiKey: string | null;
  availableModels: string[];
  enabledModelIds: string[];
  modelVisionById?: Record<string, boolean>;
  modelThinkingById?: Record<string, boolean>;
}

export interface SettingsPersisted {
  providerMode: ProviderMode;
  dashscope: ProviderProfilePersisted & { region: DashScopeRegion };
  openaiCompatible: ProviderProfilePersisted & { baseURL: string };
  objectStorage: ObjectStorageSettingsPersisted;
  theme?: ThemeMode;
  enableThinking?: boolean;
  enableSearch?: boolean;
}

/** 升级前扁平结构（仅用于迁移检测） */
export interface LegacySettingsPersisted {
  baseURL?: string;
  encryptedApiKey?: string | null;
  availableModels?: string[];
  enabledModelIds?: string[];
  theme?: ThemeMode;
  enableThinking?: boolean;
  enableSearch?: boolean;
}

export interface AppMeta {
  lastOpenedConversationId: string | null;
}

export interface DashScopeProfileSaveInput {
  region?: DashScopeRegion;
  apiKey?: string;
  availableModels?: string[];
  enabledModelIds?: string[];
  modelVisionById?: Record<string, boolean>;
  modelThinkingById?: Record<string, boolean>;
}

export interface OpenAICompatibleProfileSaveInput {
  baseURL?: string;
  apiKey?: string;
  availableModels?: string[];
  enabledModelIds?: string[];
  modelVisionById?: Record<string, boolean>;
  modelThinkingById?: Record<string, boolean>;
}

export interface ObjectStorageSaveInput {
  enabled?: boolean;
  endpoint?: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  /** 非空时更新；留空表示保留已保存的 Secret */
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  publicBaseUrl?: string;
  keyPrefix?: string;
  usePresignedUrls?: boolean;
  presignedUrlExpirySeconds?: number;
}

export interface AttachmentUploadInput {
  conversationId: string;
  attachmentId: string;
  mimeType: string;
  fileName?: string;
  dataBase64: string;
}

export interface AttachmentUploadResult {
  id: string;
  mimeType: string;
  fileName?: string;
  objectKey: string;
  url: string;
}

export interface ObjectStorageTestInput {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey?: string;
  forcePathStyle: boolean;
}

export interface SettingsSaveInput {
  providerMode?: ProviderMode;
  dashscope?: DashScopeProfileSaveInput;
  openaiCompatible?: OpenAICompatibleProfileSaveInput;
  objectStorage?: ObjectStorageSaveInput;
  theme?: ThemeMode;
  enableThinking?: boolean;
  enableSearch?: boolean;
}
