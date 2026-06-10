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
 * 为 OpenAI 兼容 Chat Completions 请求生成扩展参数。
 * 思考开关使用 chat_template_kwargs.enable_thinking；百炼兼容端点另含联网搜索参数。
 */
export function buildModelChatParams(input: BuildModelChatParamsInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    chat_template_kwargs: {
      enable_thinking: input.enableThinking,
    },
  };

  if (!isDashScopeCompatibleBaseUrl(input.baseURL)) {
    return body;
  }

  const caps = resolveModelCapabilities(input.model);

  if (input.enableSearch && caps.webSearch) {
    body.enable_search = true;
    const strategy: SearchStrategy = caps.searchStrategyWhenThinking ?? 'turbo';
    const searchOptions: Record<string, unknown> = {
      search_strategy: strategy,
    };
    if (input.enableThinking) {
      searchOptions.forced_search = true;
    }
    if (caps.searchEnableSource || strategy === 'agent' || strategy === 'agent_max') {
      searchOptions.enable_source = true;
    }
    body.search_options = searchOptions;
  }

  return body;
}
