import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isRemoteAccessibleImageUrl } from './image-url-validation';
import type { Message } from './types';

export interface BuildUserMessageContentOptions {
  /** 为 false 时不向 API 附带 image_url（历史有图但当前模型不支持多模态） */
  includeImages?: boolean;
}

export function buildUserMessageContent(
  message: Message,
  options?: BuildUserMessageContentOptions,
): string | ChatCompletionContentPart[] {
  const attachments = message.attachments ?? [];
  const includeImages = options?.includeImages !== false;

  if (attachments.length === 0) {
    return message.content;
  }

  if (!includeImages) {
    const text = message.content.trim();
    if (text) return text;
    return '[图片]';
  }

  const parts: ChatCompletionContentPart[] = [];
  const text = message.content.trim();
  if (text) {
    parts.push({ type: 'text', text });
  }
  for (const att of attachments) {
    const url = att.url?.trim();
    if (!isRemoteAccessibleImageUrl(url)) continue;
    parts.push({
      type: 'image_url',
      image_url: { url: url! },
    });
  }

  if (parts.length === 0) return message.content;
  return parts;
}

/** 从已组装的 history 中移除 image_url，仅保留文本 */
export function stripImagePartsFromChatHistory(
  messages: ChatCompletionMessageParam[],
): ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg;
    const hadImage = msg.content.some((p) => p.type === 'image_url');
    if (!hadImage) return msg;

    const text = msg.content
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && Boolean(p.text))
      .map((p) => p.text)
      .join('\n')
      .trim();

    return { role: 'user', content: text || '[图片]' };
  });
}
