import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isRemoteAccessibleImageUrl } from './image-url-validation';
import type { Message } from './types';

/** 本地消息是否含图片附件 */
export function messageHasImageAttachments(message: Message): boolean {
  return message.role === 'user' && (message.attachments?.length ?? 0) > 0;
}

/** 会话历史中是否出现过带图用户消息 */
export function conversationHasImageAttachments(messages: Message[]): boolean {
  return messages.some(messageHasImageAttachments);
}

/** 已组装的 OpenAI 风格 history 是否含 image_url */
export function openAiMessagesHaveImages(messages: ChatCompletionMessageParam[]): boolean {
  for (const msg of messages) {
    if (msg.role !== 'user' || !Array.isArray(msg.content)) continue;
    if (
      msg.content.some(
        (p) =>
          p.type === 'image_url' && isRemoteAccessibleImageUrl(p.image_url?.url),
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 是否必须走 DashScope multimodal-generation。
 * 仅以已组装且含有效 image_url 的 history 为准，避免仅有附件元数据却未配 S3 时误走多模态。
 */
export function shouldUseMultimodalApi(
  _sourceMessages: Message[],
  apiMessages: ChatCompletionMessageParam[],
): boolean {
  return openAiMessagesHaveImages(apiMessages);
}
