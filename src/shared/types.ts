export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface SearchResultItem {
  index: number;
  title: string;
  url: string;
  site_name?: string;
  icon?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
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
}

export interface DashScopeProfile extends ProviderProfile {
  region: DashScopeRegion;
}

export interface OpenAICompatibleProfile extends ProviderProfile {
  baseURL: string;
}

export interface AppSettings {
  providerMode: ProviderMode;
  dashscope: DashScopeProfile;
  openaiCompatible: OpenAICompatibleProfile;
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
}

export interface SettingsPersisted {
  providerMode: ProviderMode;
  dashscope: ProviderProfilePersisted & { region: DashScopeRegion };
  openaiCompatible: ProviderProfilePersisted & { baseURL: string };
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
}

export interface OpenAICompatibleProfileSaveInput {
  baseURL?: string;
  apiKey?: string;
  availableModels?: string[];
  enabledModelIds?: string[];
}

export interface SettingsSaveInput {
  providerMode?: ProviderMode;
  dashscope?: DashScopeProfileSaveInput;
  openaiCompatible?: OpenAICompatibleProfileSaveInput;
  theme?: ThemeMode;
  enableThinking?: boolean;
  enableSearch?: boolean;
}
