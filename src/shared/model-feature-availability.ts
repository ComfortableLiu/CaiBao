import type { ResolvedProviderConfig } from './provider-config';
import { supportsDashScopeModelFeatures } from './provider-config';
import { resolveModelCapabilities } from './model-capabilities';

export interface ModelFeatureAvailability {
  thinking: boolean;
  webSearch: boolean;
}

export function getModelFeatureAvailability(
  model: string,
  provider: ResolvedProviderConfig,
): ModelFeatureAvailability {
  if (!supportsDashScopeModelFeatures(provider)) {
    return { thinking: false, webSearch: false };
  }
  const caps = resolveModelCapabilities(model);
  return {
    thinking: caps.thinking,
    webSearch: caps.webSearch,
  };
}

export function getThinkingUnavailableReason(
  model: string,
  provider: ResolvedProviderConfig,
): string | undefined {
  if (!supportsDashScopeModelFeatures(provider)) {
    return '当前 API 端点不支持深度思考';
  }
  if (!resolveModelCapabilities(model).thinking) {
    return '当前模型不支持深度思考';
  }
  return undefined;
}

export function getWebSearchUnavailableReason(
  model: string,
  provider: ResolvedProviderConfig,
): string | undefined {
  if (!supportsDashScopeModelFeatures(provider)) {
    return '当前 API 端点不支持联网搜索';
  }
  if (!resolveModelCapabilities(model).webSearch) {
    return '当前模型不支持联网搜索';
  }
  return undefined;
}

