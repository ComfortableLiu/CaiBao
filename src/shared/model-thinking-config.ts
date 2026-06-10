import { getActiveProfile } from './provider-config';
import { resolveModelCapabilities } from './model-capabilities';
import type { AppSettings } from './types';

/** 新启用模型时的默认「支持思考」推断（仅作初始值，聊天以 modelThinkingById 为准） */
export function getDefaultModelThinking(modelId: string): boolean {
  return resolveModelCapabilities(modelId).thinking;
}

export function getModelThinkingEnabled(modelId: string, settings: AppSettings): boolean {
  const profile = getActiveProfile(settings);
  if (Object.prototype.hasOwnProperty.call(profile.modelThinkingById, modelId)) {
    return profile.modelThinkingById[modelId];
  }
  return getDefaultModelThinking(modelId);
}

export function backfillModelThinkingById(
  enabledModelIds: string[],
  existing: Record<string, boolean> = {},
): Record<string, boolean> {
  const next = { ...existing };
  for (const id of enabledModelIds) {
    if (!Object.prototype.hasOwnProperty.call(next, id)) {
      next[id] = getDefaultModelThinking(id);
    }
  }
  for (const id of Object.keys(next)) {
    if (!enabledModelIds.includes(id)) {
      delete next[id];
    }
  }
  return next;
}
