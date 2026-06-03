import { isDashScopeCompatibleBaseUrl } from './model-capabilities';
import type { AppSettings, DashScopeRegion, ProviderMode } from './types';

/** OpenAI 兼容端点：用于 models.list 等 */
export const DASHSCOPE_COMPATIBLE_ENDPOINTS: Record<DashScopeRegion, string> = {
  'cn-beijing': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  'ap-southeast-1': 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
  'us-east-1': 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
};

/** DashScope 原生 Generation HTTP（联网搜索来源等完整能力） */
export const DASHSCOPE_GENERATION_ENDPOINTS: Record<DashScopeRegion, string> = {
  'cn-beijing':
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  'ap-southeast-1':
    'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  'us-east-1':
    'https://dashscope-us.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
};

/** DashScope 多模态 Generation HTTP（含图片 input） */
export const DASHSCOPE_MULTIMODAL_GENERATION_ENDPOINTS: Record<DashScopeRegion, string> = {
  'cn-beijing':
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  'ap-southeast-1':
    'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  'us-east-1':
    'https://dashscope-us.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
};

/** @deprecated 使用 DASHSCOPE_COMPATIBLE_ENDPOINTS */
export const DASHSCOPE_ENDPOINTS = DASHSCOPE_COMPATIBLE_ENDPOINTS;

export const DASHSCOPE_REGION_LABELS: Record<DashScopeRegion, string> = {
  'cn-beijing': '中国内地（北京）',
  'ap-southeast-1': '新加坡',
  'us-east-1': '美国（弗吉尼亚）',
};

export type ProviderTransport = 'dashscope-http' | 'openai-compatible';

export interface ResolvedProviderConfigBase {
  apiKey: string;
}

export interface ResolvedDashScopeConfig extends ResolvedProviderConfigBase {
  transport: 'dashscope-http';
  /** 兼容端点，用于拉取模型列表与 UI 能力判断 */
  baseURL: string;
  generationUrl: string;
  multimodalGenerationUrl: string;
  region: DashScopeRegion;
}

export interface ResolvedOpenAICompatibleConfig extends ResolvedProviderConfigBase {
  transport: 'openai-compatible';
  baseURL: string;
}

export type ResolvedProviderConfig = ResolvedDashScopeConfig | ResolvedOpenAICompatibleConfig;

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function regionFromEndpointMap(
  baseURL: string,
  endpoints: Record<DashScopeRegion, string>,
): DashScopeRegion | undefined {
  const normalized = normalizeBaseUrl(baseURL);
  for (const [region, endpoint] of Object.entries(endpoints) as [DashScopeRegion, string][]) {
    if (normalizeBaseUrl(endpoint) === normalized) {
      return region;
    }
  }
  return undefined;
}

export function findDashScopeRegionByBaseUrl(baseURL: string): DashScopeRegion | undefined {
  return (
    regionFromEndpointMap(baseURL, DASHSCOPE_COMPATIBLE_ENDPOINTS) ??
    regionFromEndpointMap(baseURL, DASHSCOPE_GENERATION_ENDPOINTS)
  );
}

export function isDashScopeBaseUrl(baseURL: string): boolean {
  return findDashScopeRegionByBaseUrl(baseURL) !== undefined;
}

export function resolveProviderConfig(settings: AppSettings): ResolvedProviderConfig {
  if (settings.providerMode === 'dashscope') {
    const region = settings.dashscope.region;
    return {
      transport: 'dashscope-http',
      region,
      baseURL: DASHSCOPE_COMPATIBLE_ENDPOINTS[region],
      generationUrl: DASHSCOPE_GENERATION_ENDPOINTS[region],
      multimodalGenerationUrl: DASHSCOPE_MULTIMODAL_GENERATION_ENDPOINTS[region],
      apiKey: settings.dashscope.apiKey,
    };
  }
  return {
    transport: 'openai-compatible',
    baseURL: normalizeBaseUrl(settings.openaiCompatible.baseURL),
    apiKey: settings.openaiCompatible.apiKey,
  };
}

export function getActiveProfile(settings: AppSettings) {
  return settings.providerMode === 'dashscope' ? settings.dashscope : settings.openaiCompatible;
}

export function providerModeLabel(mode: ProviderMode): string {
  return mode === 'dashscope' ? 'DashScope（百炼）' : 'OpenAI 兼容';
}

export function supportsDashScopeModelFeatures(config: ResolvedProviderConfig): boolean {
  return config.transport === 'dashscope-http' || isDashScopeCompatibleBaseUrl(config.baseURL);
}
