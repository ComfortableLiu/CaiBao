import { create } from 'zustand';
import type { AppSettings, SettingsSaveInput } from '@shared/types';
import { isObjectStorageReady, isProviderReady } from '@shared/settings-readiness';
import { getApi } from '../services/api';

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  save: (partial: SettingsSaveInput) => Promise<void>;
  setLocal: (partial: Partial<AppSettings>) => void;
}

function createEmptySettings(): AppSettings {
  return {
    providerMode: 'dashscope',
    dashscope: {
      region: 'cn-beijing',
      apiKey: '',
      availableModels: [],
      enabledModelIds: [],
      modelVisionById: {},
    },
    openaiCompatible: {
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      availableModels: [],
      enabledModelIds: [],
      modelVisionById: {},
    },
    objectStorage: {
      enabled: false,
      endpoint: '',
      region: '',
      bucket: '',
      accessKeyId: '',
      secretAccessKey: '',
      forcePathStyle: true,
      publicBaseUrl: '',
      keyPrefix: '',
      usePresignedUrls: false,
      presignedUrlExpirySeconds: 86400,
    },
    theme: 'system',
    enableThinking: true,
    enableSearch: true,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...createEmptySettings(),
  loaded: false,
  load: async () => {
    const data = await getApi().settings.get();
    set({ ...data, loaded: true });
  },
  save: async (partial) => {
    const data = await getApi().settings.save(partial);
    set({ ...data });
  },
  setLocal: (partial) => set({ ...get(), ...partial }),
}));

/** @deprecated 使用 isProviderReady */
export function hasEnabledModel(): boolean {
  return isProviderReady(useSettingsStore.getState());
}

export { isObjectStorageReady, isProviderReady };
