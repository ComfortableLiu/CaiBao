import { resolveModelCapabilities, type SearchStrategy } from './model-capabilities';

export interface BuildDashScopeGenerationParamsInput {
  model: string;
  enableThinking: boolean;
  enableSearch: boolean;
}

/**
 * DashScope 原生 Generation HTTP 的 parameters 字段。
 * @see https://help.aliyun.com/zh/model-studio/qwen-api-via-dashscope
 */
export function buildDashScopeGenerationParameters(
  input: BuildDashScopeGenerationParamsInput,
): Record<string, unknown> {
  const caps = resolveModelCapabilities(input.model);
  const parameters: Record<string, unknown> = {
    result_format: 'message',
    incremental_output: true,
  };

  if (input.enableThinking) {
    parameters.enable_thinking = true;
  }

  if (input.enableSearch && caps.webSearch) {
    parameters.enable_search = true;
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
    parameters.search_options = searchOptions;
  }

  return parameters;
}
