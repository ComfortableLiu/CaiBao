export type SettingsSection = 'provider' | 'object-storage' | 'preferences';

export const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  provider: '模型服务',
  'object-storage': '对象存储',
  preferences: '聊天偏好',
};
