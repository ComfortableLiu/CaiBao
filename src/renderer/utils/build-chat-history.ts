import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import {
  buildUserMessageContent,
  stripImagePartsFromChatHistory,
} from '@shared/multimodal-content';
import { shouldUseMultimodalApi } from '@shared/multimodal-history';
import { getModelVisionEnabled } from '@shared/model-vision-config';
import { isObjectStorageReady } from '@shared/settings-readiness';
import type { AppSettings, Message } from '@shared/types';
import { getApi } from '../services/api';

export interface BuildChatHistoryOptions {
  settings?: AppSettings;
  modelId?: string;
}

async function resolveAttachmentUrls(
  message: Message,
  objectStorageReady: boolean,
): Promise<Message> {
  const attachments = message.attachments;
  if (!attachments?.length) return message;
  if (!objectStorageReady) return message;

  const refreshed = await Promise.all(
    attachments.map(async (att) => {
      try {
        const url = await getApi().objectStorage.refreshUrl(att);
        return { ...att, url };
      } catch {
        return att;
      }
    }),
  );

  return { ...message, attachments: refreshed };
}

export async function buildChatHistory(
  messages: Message[],
  excludeAssistantId: string,
  options?: BuildChatHistoryOptions,
): Promise<ChatCompletionMessageParam[]> {
  const filtered = messages.filter((m) => m.id !== excludeAssistantId);
  const result: ChatCompletionMessageParam[] = [];
  const settings = options?.settings;
  const objectStorageReady = settings ? isObjectStorageReady(settings) : false;
  const includeImages =
    settings && options?.modelId
      ? getModelVisionEnabled(options.modelId, settings)
      : false;

  for (const m of filtered) {
    if (m.role === 'user') {
      const resolved = await resolveAttachmentUrls(m, objectStorageReady);
      result.push({
        role: 'user',
        content: buildUserMessageContent(resolved, { includeImages }),
      });
    } else {
      result.push({
        role: 'assistant',
        content: m.error ? '' : m.content,
      });
    }
  }

  if (!includeImages) {
    return stripImagePartsFromChatHistory(result);
  }

  return result;
}

export function historyRequiresMultimodalApi(
  sourceMessages: Message[],
  history: ChatCompletionMessageParam[],
): boolean {
  return shouldUseMultimodalApi(sourceMessages, history);
}
