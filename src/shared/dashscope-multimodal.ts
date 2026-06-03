import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isRemoteAccessibleImageUrl } from './image-url-validation';
import { openAiMessagesHaveImages } from './multimodal-history';

export type DashScopeMultimodalContentPart = { image: string } | { text: string };

export { openAiMessagesHaveImages };

export interface DashScopeMultimodalMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | DashScopeMultimodalContentPart[];
}

function partsFromOpenAiUserContent(
  content: ChatCompletionMessageParam['content'],
): DashScopeMultimodalContentPart[] {
  if (!Array.isArray(content)) return [];
  const images: DashScopeMultimodalContentPart[] = [];
  const texts: DashScopeMultimodalContentPart[] = [];
  for (const part of content) {
    if (part.type === 'image_url' && isRemoteAccessibleImageUrl(part.image_url?.url)) {
      images.push({ image: part.image_url!.url });
    } else if (part.type === 'text' && part.text) {
      texts.push({ text: part.text });
    }
  }
  return [...images, ...texts];
}

/**
 * 将 OpenAI 风格 messages 转为 DashScope 多模态 Generation 的 input.messages。
 * @see https://help.aliyun.com/zh/model-studio/developer-reference/qwen-vl-plus-api
 */
export function toDashScopeMultimodalMessages(
  messages: ChatCompletionMessageParam[],
): DashScopeMultimodalMessage[] {
  return messages.map((msg) => {
    const role = msg.role as DashScopeMultimodalMessage['role'];
    if (role === 'user' && Array.isArray(msg.content)) {
      const hasImage = msg.content.some(
        (p) => p.type === 'image_url' && isRemoteAccessibleImageUrl(p.image_url?.url),
      );
      if (hasImage) {
        const parts = partsFromOpenAiUserContent(msg.content);
        if (parts.length === 1 && 'text' in parts[0]) {
          return { role: 'user', content: parts[0].text };
        }
        return { role: 'user', content: parts };
      }
    }
    const text =
      typeof msg.content === 'string'
        ? msg.content
        : partsFromOpenAiUserContent(msg.content)
            .filter((p): p is { text: string } => 'text' in p)
            .map((p) => p.text)
            .join('\n');
    return { role, content: text };
  });
}

/** 多模态流式请求的 parameters（与文本 Generation 的 thinking/search 分离） */
export function buildDashScopeMultimodalParameters(): Record<string, unknown> {
  return {
    result_format: 'message',
    incremental_output: true,
  };
}

export { extractDashScopeStreamText as extractDashScopeMessageText } from './dashscope-stream-content';
