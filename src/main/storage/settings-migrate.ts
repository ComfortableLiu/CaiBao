import {
  DASHSCOPE_COMPATIBLE_ENDPOINTS,
  findDashScopeRegionByBaseUrl,
  normalizeBaseUrl,
} from '@shared/provider-config';
import { backfillModelVisionById } from '@shared/model-vision-config';
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
    modelVisionById: {} as Record<string, boolean>,
  };
}

export function createDefaultObjectStoragePersisted() {
  return {
    enabled: false,
    endpoint: '',
    region: '',
    bucket: '',
    encryptedAccessKeyId: null as string | null,
    encryptedSecretAccessKey: null as string | null,
    forcePathStyle: true,
    publicBaseUrl: '',
    keyPrefix: '',
    usePresignedUrls: false,
    presignedUrlExpirySeconds: 86400,
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
    objectStorage: createDefaultObjectStoragePersisted(),
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

  const objectStorage = createDefaultObjectStoragePersisted();

  if (region) {
    return {
      providerMode: 'dashscope',
      dashscope: { region, ...shared },
      openaiCompatible: {
        baseURL: 'https://api.openai.com/v1',
        ...emptyProfile(),
      },
      objectStorage,
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
    objectStorage,
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

  const dashscopeEnabled =
    input.dashscope?.enabledModelIds ?? defaults.dashscope.enabledModelIds;
  const openaiEnabled =
    input.openaiCompatible?.enabledModelIds ?? defaults.openaiCompatible.enabledModelIds;

  return {
    providerMode,
    dashscope: {
      region,
      encryptedApiKey: input.dashscope?.encryptedApiKey ?? defaults.dashscope.encryptedApiKey,
      availableModels: input.dashscope?.availableModels ?? defaults.dashscope.availableModels,
      enabledModelIds: dashscopeEnabled,
      modelVisionById: backfillModelVisionById(
        dashscopeEnabled,
        input.dashscope?.modelVisionById ?? defaults.dashscope.modelVisionById,
      ),
    },
    openaiCompatible: {
      baseURL: normalizeBaseUrl(
        input.openaiCompatible?.baseURL ?? defaults.openaiCompatible.baseURL,
      ),
      encryptedApiKey:
        input.openaiCompatible?.encryptedApiKey ?? defaults.openaiCompatible.encryptedApiKey,
      availableModels:
        input.openaiCompatible?.availableModels ?? defaults.openaiCompatible.availableModels,
      enabledModelIds: openaiEnabled,
      modelVisionById: backfillModelVisionById(
        openaiEnabled,
        input.openaiCompatible?.modelVisionById ?? defaults.openaiCompatible.modelVisionById,
      ),
    },
    objectStorage: {
      enabled: input.objectStorage?.enabled ?? defaults.objectStorage.enabled,
      endpoint: input.objectStorage?.endpoint ?? defaults.objectStorage.endpoint,
      region: input.objectStorage?.region ?? defaults.objectStorage.region,
      bucket: input.objectStorage?.bucket ?? defaults.objectStorage.bucket,
      encryptedAccessKeyId:
        input.objectStorage?.encryptedAccessKeyId ?? defaults.objectStorage.encryptedAccessKeyId,
      encryptedSecretAccessKey:
        input.objectStorage?.encryptedSecretAccessKey ??
        defaults.objectStorage.encryptedSecretAccessKey,
      forcePathStyle:
        input.objectStorage?.forcePathStyle ?? defaults.objectStorage.forcePathStyle,
      publicBaseUrl: input.objectStorage?.publicBaseUrl ?? defaults.objectStorage.publicBaseUrl,
      keyPrefix: input.objectStorage?.keyPrefix ?? defaults.objectStorage.keyPrefix,
      usePresignedUrls:
        input.objectStorage?.usePresignedUrls ?? defaults.objectStorage.usePresignedUrls,
      presignedUrlExpirySeconds:
        input.objectStorage?.presignedUrlExpirySeconds ??
        defaults.objectStorage.presignedUrlExpirySeconds,
    },
    theme: input.theme ?? defaults.theme,
    enableThinking: input.enableThinking ?? defaults.enableThinking,
    enableSearch: input.enableSearch ?? defaults.enableSearch,
  };
}

export { DASHSCOPE_COMPATIBLE_ENDPOINTS as DASHSCOPE_ENDPOINTS };
