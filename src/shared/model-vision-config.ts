import { getActiveProfile } from './provider-config';
import { resolveModelCapabilities } from './model-capabilities';
import type { AppSettings } from './types';

/** 新启用模型时的默认「支持图片」推断（仅作初始值，聊天以 modelVisionById 为准） */
export function getDefaultModelVision(modelId: string): boolean {
  return resolveModelCapabilities(modelId).vision;
}

export function getModelVisionEnabled(modelId: string, settings: AppSettings): boolean {
  const profile = getActiveProfile(settings);
  if (Object.prototype.hasOwnProperty.call(profile.modelVisionById, modelId)) {
    return profile.modelVisionById[modelId];
  }
  return getDefaultModelVision(modelId);
}

export function getVisionUnavailableReason(
  modelId: string,
  settings: AppSettings,
): string | undefined {
  if (!modelId) return '请先选择模型';
  if (getModelVisionEnabled(modelId, settings)) return undefined;
  return '当前模型未启用图片输入，请在设置 → 模型服务中点击编辑开启';
}

export function backfillModelVisionById(
  enabledModelIds: string[],
  existing: Record<string, boolean> = {},
): Record<string, boolean> {
  const next = { ...existing };
  for (const id of enabledModelIds) {
    if (!Object.prototype.hasOwnProperty.call(next, id)) {
      next[id] = getDefaultModelVision(id);
    }
  }
  for (const id of Object.keys(next)) {
    if (!enabledModelIds.includes(id)) {
      delete next[id];
    }
  }
  return next;
}
