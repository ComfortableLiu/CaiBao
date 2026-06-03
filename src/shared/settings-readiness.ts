import { getActiveProfile, resolveProviderConfig } from './provider-config';
import type { AppSettings } from './types';

export function isProviderReady(settings: AppSettings): boolean {
  const { baseURL, apiKey } = resolveProviderConfig(settings);
  const profile = getActiveProfile(settings);
  return Boolean(baseURL && apiKey && profile.enabledModelIds.length > 0);
}

export function isObjectStorageReady(settings: AppSettings): boolean {
  const os = settings.objectStorage;
  if (!os.enabled) return false;
  return Boolean(
    os.endpoint.trim() &&
      os.bucket.trim() &&
      os.accessKeyId.trim() &&
      os.secretAccessKey.trim(),
  );
}

export type SetupGateReason = 'provider' | null;

/** 仅模型服务未就绪时阻断聊天；对象存储在尝试上传图片时再提示 */
export function getSetupGateReason(settings: AppSettings): SetupGateReason {
  if (!isProviderReady(settings)) return 'provider';
  return null;
}

export function getObjectStorageUploadBlockReason(settings: AppSettings): string | null {
  if (isObjectStorageReady(settings)) return null;
  return '请先在「设置 → 对象存储」中启用并保存 S3 配置后再上传图片';
}
