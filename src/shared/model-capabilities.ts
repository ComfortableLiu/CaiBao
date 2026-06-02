/**
 * 模型能力配置（基于阿里云百炼联网搜索 / 深度思考文档）。
 * 规则按优先级从上到下匹配，首个命中生效。
 */

export type SearchStrategy = 'turbo' | 'max' | 'agent' | 'agent_max';

export interface ModelCapabilities {
  /** 是否支持 enable_thinking */
  thinking: boolean;
  /** 是否支持 enable_search（Chat Completions） */
  webSearch: boolean;
  /** 开启深度思考且联网时使用的 search_strategy */
  searchStrategyWhenThinking?: SearchStrategy;
  /** agent / agent_max 策略下启用返回搜索来源 */
  searchEnableSource?: boolean;
}

export interface ModelCapabilityRule {
  /** 对 model id 做不区分大小写匹配 */
  pattern: RegExp;
  capabilities: ModelCapabilities;
}

/** 未命中任何规则时的默认能力（保守：不传百炼扩展参数） */
export const DEFAULT_MODEL_CAPABILITIES: ModelCapabilities = {
  thinking: false,
  webSearch: false,
};

/**
 * 模型能力表：更具体的规则应排在前面。
 * 快照版本模型（如 qwen3-max-2025-09-23）需先于通用 qwen3-max 规则。
 */
export const MODEL_CAPABILITY_RULES: ModelCapabilityRule[] = [
  // —— 需 agent 策略的型号 ——
  {
    pattern: /^qwen3-max-2025-09-23/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'agent',
      searchEnableSource: true,
    },
  },
  {
    pattern: /^qwen3-max-2026-01-23/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'agent_max',
      searchEnableSource: true,
    },
  },
  {
    pattern: /^qwen3-max(?:-preview)?$/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'agent_max',
      searchEnableSource: true,
    },
  },
  {
    pattern: /^qwen3-max/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'agent_max',
      searchEnableSource: true,
    },
  },
  {
    pattern: /^qwen3\.5-omni/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'agent',
      searchEnableSource: true,
    },
  },
  // —— Qwen3.7 / 3.6（部分能力仅 Responses API；Chat 仍走 enable_search）——
  {
    pattern: /^qwen3\.7-max/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  {
    pattern: /^qwen3\.6-(?:max|plus|flash)/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  // —— Qwen3.5 系列 ——
  {
    pattern: /^qwen3\.5-(?:plus|flash)/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'turbo',
    },
  },
  // —— 角色扮演（优先于通用 qwen-plus 规则）——
  {
    pattern: /-character/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'turbo',
    },
  },
  // —— 千问通用（Plus / Flash / Turbo / Max 等）——
  {
    pattern: /^qwen-(?:plus|flash|turbo|max)/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  {
    pattern: /^qwq-/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  // —— 第三方（百炼接入）——
  {
    pattern: /^deepseek-/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  {
    pattern: /^moonshot-kimi-/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  {
    pattern: /^minimax-/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'max',
    },
  },
  // —— 其余 qwen 前缀兜底（2025-07 后多数支持联网）——
  {
    pattern: /^qwen/i,
    capabilities: {
      thinking: true,
      webSearch: true,
      searchStrategyWhenThinking: 'turbo',
    },
  },
];

export function normalizeModelId(modelId: string): string {
  return modelId.trim().toLowerCase();
}

export function resolveModelCapabilities(modelId: string): ModelCapabilities {
  const id = normalizeModelId(modelId);
  for (const rule of MODEL_CAPABILITY_RULES) {
    if (rule.pattern.test(id)) {
      return rule.capabilities;
    }
  }
  return DEFAULT_MODEL_CAPABILITIES;
}

export function isDashScopeCompatibleBaseUrl(baseURL: string): boolean {
  const url = baseURL.toLowerCase();
  return (
    url.includes('dashscope.aliyuncs.com') ||
    url.includes('dashscope-intl.aliyuncs.com') ||
    url.includes('dashscope-us.aliyuncs.com') ||
    url.includes('cn-hongkong.dashscope.aliyuncs.com') ||
    url.includes('compatible-mode')
  );
}
