import {
  DASHSCOPE_COMPATIBLE_ENDPOINTS,
  findDashScopeRegionByBaseUrl,
  normalizeBaseUrl,
} from '@shared/provider-config';
import type {
  DashScopeRegion,
  LegacySettingsPersisted,
  SettingsPersisted,
} from '@shared/types';

const DEFAULT_DASHSCOPE_REGION: DashScopeRegion = 'cn-beijing';

function emptyProfile() {
  return {
    encryptedApiKey: null as string | null,
    availableModels: [] as string[],
    enabledModelIds: [] as string[],
  };
}

export function createDefaultSettingsPersisted(): SettingsPersisted {
  return {
    providerMode: 'dashscope',
    dashscope: {
      region: DEFAULT_DASHSCOPE_REGION,
      ...emptyProfile(),
    },
    openaiCompatible: {
      baseURL: 'https://api.openai.com/v1',
      ...emptyProfile(),
    },
    theme: 'system',
    enableThinking: true,
    enableSearch: true,
  };
}

export function isLegacySettingsPersisted(raw: unknown): raw is LegacySettingsPersisted {
  if (!raw || typeof raw !== 'object') return false;
  const record = raw as Record<string, unknown>;
  return typeof record.baseURL === 'string' && record.providerMode === undefined;
}

export function migrateLegacySettings(legacy: LegacySettingsPersisted): SettingsPersisted {
  const baseURL = normalizeBaseUrl(legacy.baseURL ?? 'https://api.openai.com/v1');
  const region = findDashScopeRegionByBaseUrl(baseURL);
  const shared = {
    encryptedApiKey: legacy.encryptedApiKey ?? null,
    availableModels: legacy.availableModels ?? [],
    enabledModelIds: legacy.enabledModelIds ?? [],
  };

  if (region) {
    return {
      providerMode: 'dashscope',
      dashscope: { region, ...shared },
      openaiCompatible: {
        baseURL: 'https://api.openai.com/v1',
        ...emptyProfile(),
      },
      theme: legacy.theme ?? 'system',
      enableThinking: legacy.enableThinking ?? true,
      enableSearch: legacy.enableSearch ?? true,
    };
  }

  return {
    providerMode: 'openai-compatible',
    dashscope: {
      region: DEFAULT_DASHSCOPE_REGION,
      ...emptyProfile(),
    },
    openaiCompatible: {
      baseURL,
      ...shared,
    },
    theme: legacy.theme ?? 'system',
    enableThinking: legacy.enableThinking ?? true,
    enableSearch: legacy.enableSearch ?? true,
  };
}

/** 确保嵌套结构完整（部分新字段缺失时补齐） */
export function normalizeSettingsPersisted(raw: unknown): SettingsPersisted {
  if (isLegacySettingsPersisted(raw)) {
    return migrateLegacySettings(raw);
  }

  const defaults = createDefaultSettingsPersisted();
  const input = (raw ?? {}) as Partial<SettingsPersisted>;

  const providerMode = input.providerMode ?? defaults.providerMode;
  const region = input.dashscope?.region ?? defaults.dashscope.region;

  return {
    providerMode,
    dashscope: {
      region,
      encryptedApiKey: input.dashscope?.encryptedApiKey ?? defaults.dashscope.encryptedApiKey,
      availableModels: input.dashscope?.availableModels ?? defaults.dashscope.availableModels,
      enabledModelIds: input.dashscope?.enabledModelIds ?? defaults.dashscope.enabledModelIds,
    },
    openaiCompatible: {
      baseURL: normalizeBaseUrl(
        input.openaiCompatible?.baseURL ?? defaults.openaiCompatible.baseURL,
      ),
      encryptedApiKey:
        input.openaiCompatible?.encryptedApiKey ?? defaults.openaiCompatible.encryptedApiKey,
      availableModels:
        input.openaiCompatible?.availableModels ?? defaults.openaiCompatible.availableModels,
      enabledModelIds:
        input.openaiCompatible?.enabledModelIds ?? defaults.openaiCompatible.enabledModelIds,
    },
    theme: input.theme ?? defaults.theme,
    enableThinking: input.enableThinking ?? defaults.enableThinking,
    enableSearch: input.enableSearch ?? defaults.enableSearch,
  };
}

export { DASHSCOPE_COMPATIBLE_ENDPOINTS as DASHSCOPE_ENDPOINTS };
