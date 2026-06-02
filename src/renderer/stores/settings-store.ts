import { create } from 'zustand';
import type { AppSettings, SettingsSaveInput } from '@shared/types';
import { getActiveProfile, resolveProviderConfig } from '@shared/provider-config';
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
    },
    openaiCompatible: {
      baseURL: 'https://api.openai.com/v1',
      apiKey: '',
      availableModels: [],
      enabledModelIds: [],
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

export function hasEnabledModel(): boolean {
  const settings = useSettingsStore.getState();
  const { baseURL, apiKey } = resolveProviderConfig(settings);
  const profile = getActiveProfile(settings);
  return Boolean(baseURL && apiKey && profile.enabledModelIds.length > 0);
}
