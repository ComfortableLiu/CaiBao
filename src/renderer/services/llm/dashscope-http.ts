import { buildDashScopeGenerationParameters } from '@shared/dashscope-generation-params';
import { requiresDashScopeMultimodalEndpoint } from '@shared/model-capabilities';
import { stripImagePartsFromChatHistory } from '@shared/multimodal-content';
import { toDashScopeMultimodalMessages } from '@shared/dashscope-multimodal';
import { shouldUseMultimodalApi } from '@shared/multimodal-history';
import type { Message } from '@shared/types';
import {
  extractDashScopeStreamDelta,
  extractDashScopeStreamText,
  getDashScopeChoicePayload,
} from '@shared/dashscope-stream-content';
import { normalizeDashScopeUsage, type DashScopeUsageRaw } from '@shared/token-usage';
import type { TokenUsage } from '@shared/types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { StreamCallbacks, StreamDelta } from './chat-service';
import { extractSearchResultsFromChunk } from './stream-parser';

async function readHttpErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as { message?: string; code?: string };
    if (json.message) return json.message;
  } catch {
    /* ignore */
  }
  return text || `HTTP ${response.status}`;
}

function assertDashScopeEnvelope(chunk: Record<string, unknown>): void {
  const code = chunk.code as string | undefined;
  const message = chunk.message as string | undefined;
  if (code && message) {
    throw new Error(message);
  }
  const statusCode = chunk.status_code as number | undefined;
  if (statusCode != null && statusCode !== 200) {
    throw new Error(message ?? `DashScope 请求失败 (${statusCode})`);
  }
}

function deltaFromDashScopeChunk(chunk: Record<string, unknown>): StreamDelta {
  const delta: StreamDelta = {};

  const usage = normalizeDashScopeUsage(chunk.usage as DashScopeUsageRaw | undefined);
  if (usage) delta.usage = usage;

  const searchResults = extractSearchResultsFromChunk(chunk);
  if (searchResults && searchResults.length > 0) {
    delta.searchResults = searchResults;
    delta.searchStatus = 'done';
  }

  const stream = extractDashScopeStreamDelta(chunk);
  if (stream.content) delta.content = stream.content;
  if (stream.reasoning) delta.reasoning = stream.reasoning;

  return delta;
}

function hasStreamDelta(delta: StreamDelta): boolean {
  return (
    delta.content !== undefined ||
    delta.reasoning !== undefined ||
    delta.searchResults !== undefined ||
    delta.searchStatus !== undefined ||
    delta.usage !== undefined
  );
}

async function* parseDashScopeSseJson(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload) as Record<string, unknown>;
            yield json;
          } catch {
            /* skip malformed chunk */
          }
        }
      }
    }

    if (buffer.trim()) {
      for (const line of buffer.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          yield JSON.parse(payload) as Record<string, unknown>;
        } catch {
          /* skip */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function streamDashScopeGeneration(
  params: {
    generationUrl: string;
    multimodalGenerationUrl: string;
    apiKey: string;
    model: string;
    messages: ChatCompletionMessageParam[];
    /** 参与组 history 的原始会话消息（用于检测历史图片附件） */
    sourceMessages?: Message[];
    /** 当前模型是否向 API 发送图片（与设置里「支持图片输入」一致） */
    modelVisionEnabled?: boolean;
    enableThinking?: boolean;
    enableSearch?: boolean;
    signal?: AbortSignal;
  },
  callbacks: StreamCallbacks,
): Promise<void> {
  const visionEnabled = params.modelVisionEnabled !== false;
  const apiMessages = visionEnabled
    ? params.messages
    : stripImagePartsFromChatHistory(params.messages);

  const hasImages = shouldUseMultimodalApi(params.sourceMessages ?? [], apiMessages);
  const useMultimodalEndpoint =
    hasImages || requiresDashScopeMultimodalEndpoint(params.model);
  const requestUrl = useMultimodalEndpoint
    ? params.multimodalGenerationUrl
    : params.generationUrl;

  const enableThinking = params.enableThinking ?? true;
  const enableSearch = params.enableSearch ?? true;

  const inputMessages = useMultimodalEndpoint
    ? toDashScopeMultimodalMessages(apiMessages)
    : apiMessages;

  const parameters = buildDashScopeGenerationParameters({
    model: params.model,
    enableThinking,
    enableSearch,
  });

  const body = {
    model: params.model,
    input: { messages: inputMessages },
    parameters,
  };

  callbacks.onStart?.();
  if (enableSearch && parameters.enable_search) {
    callbacks.onDelta({ searchStatus: 'searching' });
  }

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-SSE': 'enable',
    },
    body: JSON.stringify(body),
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response));
  }

  if (!response.body) {
    throw new Error('DashScope 流式响应为空');
  }

  let usage: TokenUsage | undefined;

  for await (const chunk of parseDashScopeSseJson(response.body)) {
    assertDashScopeEnvelope(chunk);
    const delta = deltaFromDashScopeChunk(chunk);
    if (delta.usage) usage = delta.usage;
    if (hasStreamDelta(delta)) {
      callbacks.onDelta(delta);
    }
  }

  callbacks.onDone(usage);
}

export async function generateTitleDashScope(
  generationUrl: string,
  apiKey: string,
  model: string,
  userMessage: string,
): Promise<string> {
  const response = await fetch(generationUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'system',
            content: '用不超过20个字总结用户问题作为对话标题，只输出标题文字，不要引号或标点结尾。',
          },
          { role: 'user', content: userMessage },
        ],
      },
      parameters: { result_format: 'message' },
    }),
  });

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response));
  }

  const json = (await response.json()) as Record<string, unknown>;
  assertDashScopeEnvelope(json);

  const output = json.output as Record<string, unknown> | undefined;
  const choices = output?.choices as unknown[] | undefined;
  const payload = getDashScopeChoicePayload(choices?.[0] as Record<string, unknown> | undefined);
  const text = extractDashScopeStreamText(payload?.content)?.trim() ?? '';
  return text;
}
