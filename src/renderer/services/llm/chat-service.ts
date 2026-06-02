import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { buildModelChatParams } from '@shared/model-chat-params';
import type { ResolvedProviderConfig } from '@shared/provider-config';
import type { SearchResultItem, TokenUsage } from '@shared/types';
import { createLlmClient } from './createLlmClient';
import { generateTitleDashScope, streamDashScopeGeneration } from './dashscope-http';
import { extractSearchResultsFromChunk } from './stream-parser';

export interface StreamDelta {
  content?: string;
  reasoning?: string;
  searchResults?: SearchResultItem[];
  searchStatus?: 'searching' | 'done';
  usage?: TokenUsage;
}

export interface StreamCallbacks {
  onStart?: () => void;
  onDelta: (delta: StreamDelta) => void;
  onDone: (usage?: TokenUsage) => void;
  onError: (error: Error) => void;
}

function normalizeOpenAIUsage(raw: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}): TokenUsage | undefined {
  if (raw.total_tokens == null && raw.prompt_tokens == null) return undefined;
  const prompt = raw.prompt_tokens ?? 0;
  const completion = raw.completion_tokens ?? 0;
  const total = raw.total_tokens ?? prompt + completion;
  return { prompt, completion, total };
}

export async function streamChatCompletion(
  provider: ResolvedProviderConfig,
  params: {
    model: string;
    messages: ChatCompletionMessageParam[];
    enableThinking?: boolean;
    enableSearch?: boolean;
    signal?: AbortSignal;
  },
  callbacks: StreamCallbacks,
): Promise<void> {
  if (provider.transport === 'dashscope-http') {
    try {
      await streamDashScopeGeneration(
        {
          generationUrl: provider.generationUrl,
          apiKey: provider.apiKey,
          model: params.model,
          messages: params.messages,
          enableThinking: params.enableThinking,
          enableSearch: params.enableSearch,
          signal: params.signal,
        },
        callbacks,
      );
    } catch (err) {
      if (params.signal?.aborted) {
        callbacks.onDone();
        return;
      }
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
    return;
  }

  const client = createLlmClient(provider.baseURL, provider.apiKey);
  try {
    callbacks.onStart?.();

    const enableThinking = params.enableThinking ?? true;
    const enableSearch = params.enableSearch ?? true;

    const requestBody: Record<string, unknown> = {
      model: params.model,
      messages: params.messages,
      stream: true,
      stream_options: { include_usage: true },
      ...buildModelChatParams({
        model: params.model,
        baseURL: provider.baseURL,
        enableThinking,
        enableSearch,
      }),
    };

    const stream = await client.chat.completions.create(
      requestBody as Parameters<typeof client.chat.completions.create>[0],
      { signal: params.signal },
    );

    let usage: TokenUsage | undefined;

    for await (const chunk of stream) {
      if (chunk.usage) {
        usage = normalizeOpenAIUsage(chunk.usage);
        if (usage) {
          callbacks.onDelta({ usage });
        }
      }

      const searchResults = extractSearchResultsFromChunk(chunk);
      if (searchResults && searchResults.length > 0) {
        callbacks.onDelta({ searchResults, searchStatus: 'done' });
      }

      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;
      const d = delta as { content?: string; reasoning_content?: string };
      const content = d.content ?? undefined;
      const reasoning = d.reasoning_content ?? undefined;
      if (content || reasoning) {
        callbacks.onDelta({ content, reasoning });
      }
    }

    callbacks.onDone(usage);
  } catch (err) {
    if (params.signal?.aborted) {
      callbacks.onDone();
      return;
    }
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function generateTitle(
  provider: ResolvedProviderConfig,
  model: string,
  userMessage: string,
): Promise<string> {
  if (provider.transport === 'dashscope-http') {
    const text = await generateTitleDashScope(
      provider.generationUrl,
      provider.apiKey,
      model,
      userMessage,
    );
    return text || fallbackTitle(userMessage);
  }

  const client = createLlmClient(provider.baseURL, provider.apiKey);
  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: '用不超过20个字总结用户问题作为对话标题，只输出标题文字，不要引号或标点结尾。',
      },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 60,
  });
  const text = res.choices[0]?.message?.content?.trim();
  return text || fallbackTitle(userMessage);
}

export function fallbackTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 24 ? `${cleaned.slice(0, 24)}…` : cleaned || '新对话';
}
