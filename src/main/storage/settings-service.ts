import fs from 'node:fs/promises';
import path from 'node:path';
import { app, safeStorage } from 'electron';
import type { AppSettings, SettingsPersisted, SettingsSaveInput } from '@shared/types';
import {
  createDefaultSettingsPersisted,
  isLegacySettingsPersisted,
  migrateLegacySettings,
  normalizeSettingsPersisted,
} from './settings-migrate';

function settingsPath(): string {
  return path.join(app.getPath('userData'), 'caibao', 'settings.json');
}

async function readRaw(): Promise<unknown> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function writePersisted(data: SettingsPersisted): Promise<void> {
  const dir = path.dirname(settingsPath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(data, null, 2), 'utf-8');
}

function encryptApiKey(apiKey: string): string | null {
  if (!apiKey) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(apiKey, 'utf-8').toString('base64');
  }
  return safeStorage.encryptString(apiKey).toString('base64');
}

function decryptApiKey(encrypted: string | null): string {
  if (!encrypted) return '';
  if (!safeStorage.isEncryptionAvailable()) {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
}

function toAppSettings(persisted: SettingsPersisted): AppSettings {
  return {
    providerMode: persisted.providerMode,
    dashscope: {
      region: persisted.dashscope.region,
      apiKey: decryptApiKey(persisted.dashscope.encryptedApiKey),
      availableModels: persisted.dashscope.availableModels,
      enabledModelIds: persisted.dashscope.enabledModelIds,
      modelVisionById: persisted.dashscope.modelVisionById ?? {},
      modelThinkingById: persisted.dashscope.modelThinkingById ?? {},
    },
    openaiCompatible: {
      baseURL: persisted.openaiCompatible.baseURL,
      apiKey: decryptApiKey(persisted.openaiCompatible.encryptedApiKey),
      availableModels: persisted.openaiCompatible.availableModels,
      enabledModelIds: persisted.openaiCompatible.enabledModelIds,
      modelVisionById: persisted.openaiCompatible.modelVisionById ?? {},
      modelThinkingById: persisted.openaiCompatible.modelThinkingById ?? {},
    },
    objectStorage: {
      enabled: persisted.objectStorage.enabled,
      endpoint: persisted.objectStorage.endpoint,
      region: persisted.objectStorage.region,
      bucket: persisted.objectStorage.bucket,
      accessKeyId: decryptApiKey(persisted.objectStorage.encryptedAccessKeyId),
      secretAccessKey: decryptApiKey(persisted.objectStorage.encryptedSecretAccessKey),
      forcePathStyle: persisted.objectStorage.forcePathStyle,
      publicBaseUrl: persisted.objectStorage.publicBaseUrl,
      keyPrefix: persisted.objectStorage.keyPrefix,
      usePresignedUrls: persisted.objectStorage.usePresignedUrls,
      presignedUrlExpirySeconds: persisted.objectStorage.presignedUrlExpirySeconds,
    },
    theme: persisted.theme ?? 'system',
    enableThinking: persisted.enableThinking ?? true,
    enableSearch: persisted.enableSearch ?? true,
  };
}

async function loadPersisted(): Promise<SettingsPersisted> {
  const raw = await readRaw();
  if (raw === null) {
    return createDefaultSettingsPersisted();
  }

  const needsMigration = isLegacySettingsPersisted(raw);
  const normalized = needsMigration
    ? migrateLegacySettings(raw)
    : normalizeSettingsPersisted(raw);

  if (needsMigration || JSON.stringify(raw) !== JSON.stringify(normalized)) {
    await writePersisted(normalized);
  }

  return normalized;
}

function applyDashScopeInput(
  persisted: SettingsPersisted,
  input: NonNullable<SettingsSaveInput['dashscope']>,
): void {
  if (input.region !== undefined) {
    persisted.dashscope.region = input.region;
  }
  if (input.apiKey !== undefined && input.apiKey.length > 0) {
    persisted.dashscope.encryptedApiKey = encryptApiKey(input.apiKey);
  }
  if (input.availableModels !== undefined) {
    persisted.dashscope.availableModels = input.availableModels;
  }
  if (input.enabledModelIds !== undefined) {
    persisted.dashscope.enabledModelIds = input.enabledModelIds;
  }
  if (input.modelVisionById !== undefined) {
    persisted.dashscope.modelVisionById = input.modelVisionById;
  }
  if (input.modelThinkingById !== undefined) {
    persisted.dashscope.modelThinkingById = input.modelThinkingById;
  }
}

function applyObjectStorageInput(
  persisted: SettingsPersisted,
  input: NonNullable<SettingsSaveInput['objectStorage']>,
): void {
  const os = persisted.objectStorage;
  if (input.enabled !== undefined) os.enabled = input.enabled;
  if (input.endpoint !== undefined) os.endpoint = input.endpoint.trim();
  if (input.region !== undefined) os.region = input.region.trim();
  if (input.bucket !== undefined) os.bucket = input.bucket.trim();
  if (input.accessKeyId !== undefined && input.accessKeyId.length > 0) {
    os.encryptedAccessKeyId = encryptApiKey(input.accessKeyId);
  }
  if (input.secretAccessKey !== undefined && input.secretAccessKey.length > 0) {
    os.encryptedSecretAccessKey = encryptApiKey(input.secretAccessKey);
  }
  if (input.forcePathStyle !== undefined) os.forcePathStyle = input.forcePathStyle;
  if (input.publicBaseUrl !== undefined) os.publicBaseUrl = input.publicBaseUrl.trim();
  if (input.keyPrefix !== undefined) os.keyPrefix = input.keyPrefix.trim();
  if (input.usePresignedUrls !== undefined) os.usePresignedUrls = input.usePresignedUrls;
  if (input.presignedUrlExpirySeconds !== undefined) {
    os.presignedUrlExpirySeconds = input.presignedUrlExpirySeconds;
  }
}

function applyOpenAICompatibleInput(
  persisted: SettingsPersisted,
  input: NonNullable<SettingsSaveInput['openaiCompatible']>,
): void {
  if (input.baseURL !== undefined) {
    persisted.openaiCompatible.baseURL = input.baseURL.replace(/\/$/, '');
  }
  if (input.apiKey !== undefined && input.apiKey.length > 0) {
    persisted.openaiCompatible.encryptedApiKey = encryptApiKey(input.apiKey);
  }
  if (input.availableModels !== undefined) {
    persisted.openaiCompatible.availableModels = input.availableModels;
  }
  if (input.enabledModelIds !== undefined) {
    persisted.openaiCompatible.enabledModelIds = input.enabledModelIds;
  }
  if (input.modelVisionById !== undefined) {
    persisted.openaiCompatible.modelVisionById = input.modelVisionById;
  }
  if (input.modelThinkingById !== undefined) {
    persisted.openaiCompatible.modelThinkingById = input.modelThinkingById;
  }
}

export class SettingsService {
  async get(): Promise<AppSettings> {
    const persisted = await loadPersisted();
    return toAppSettings(persisted);
  }

  async save(input: SettingsSaveInput): Promise<AppSettings> {
    const persisted = await loadPersisted();

    if (input.providerMode !== undefined) {
      persisted.providerMode = input.providerMode;
    }
    if (input.dashscope) {
      applyDashScopeInput(persisted, input.dashscope);
    }
    if (input.openaiCompatible) {
      applyOpenAICompatibleInput(persisted, input.openaiCompatible);
    }
    if (input.theme !== undefined) {
      persisted.theme = input.theme;
    }
    if (input.enableThinking !== undefined) {
      persisted.enableThinking = input.enableThinking;
    }
    if (input.enableSearch !== undefined) {
      persisted.enableSearch = input.enableSearch;
    }
    if (input.objectStorage) {
      applyObjectStorageInput(persisted, input.objectStorage);
    }

    await writePersisted(persisted);
    return this.get();
  }
}
