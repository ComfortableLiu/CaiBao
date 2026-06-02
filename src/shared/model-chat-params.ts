import {
  isDashScopeCompatibleBaseUrl,
  resolveModelCapabilities,
  type SearchStrategy,
} from './model-capabilities';

export interface BuildModelChatParamsInput {
  model: string;
  baseURL: string;
  enableThinking: boolean;
  enableSearch: boolean;
}

/**
 * 为 OpenAI 兼容 Chat Completions 请求生成顶层扩展参数（如用户自建兼容网关仍指向百炼）。
 */
export function buildModelChatParams(input: BuildModelChatParamsInput): Record<string, unknown> {
  if (!isDashScopeCompatibleBaseUrl(input.baseURL)) {
    return {};
  }

  const caps = resolveModelCapabilities(input.model);
  const body: Record<string, unknown> = {};

  if (input.enableThinking && caps.thinking) {
    body.enable_thinking = true;
  }

  if (input.enableSearch && caps.webSearch) {
    body.enable_search = true;
    const strategy: SearchStrategy = caps.searchStrategyWhenThinking ?? 'turbo';
    const searchOptions: Record<string, unknown> = {
      search_strategy: strategy,
    };
    if (input.enableThinking && caps.thinking) {
      searchOptions.forced_search = true;
    }
    if (caps.searchEnableSource || strategy === 'agent' || strategy === 'agent_max') {
      searchOptions.enable_source = true;
    }
    body.search_options = searchOptions;
  }

  return body;
}
