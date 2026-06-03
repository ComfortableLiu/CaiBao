/**
 * DashScope 流式/非流式响应中 message 字段的文本提取。
 *
 * 兼容两种正文形态：
 * 1. 文本 Generation：`content: "增量文本"`
 * 2. 多模态 Generation：`content: [{ "text": "增量文本" }]`
 *
 * reasoning_content 亦可能为 string 或相同数组结构。
 */

function textFromPart(part: unknown): string {
  if (!part || typeof part !== 'object') return '';
  const record = part as Record<string, unknown>;
  if (typeof record.text === 'string') return record.text;
  return '';
}

/**
 * 从 DashScope message.content / reasoning_content 等字段提取文本。
 */
export function extractDashScopeStreamText(field: unknown): string | undefined {
  if (field == null) return undefined;

  if (typeof field === 'string') {
    return field.length > 0 ? field : undefined;
  }

  if (Array.isArray(field)) {
    if (field.length === 0) return undefined;
    let combined = '';
    for (const part of field) {
      combined += textFromPart(part);
    }
    return combined.length > 0 ? combined : undefined;
  }

  return undefined;
}

/** 从单条 choice 中取 message 或 delta 载荷（不同接口命名） */
export function getDashScopeChoicePayload(
  choice: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!choice) return undefined;
  const message = choice.message;
  if (message && typeof message === 'object') {
    return message as Record<string, unknown>;
  }
  const delta = choice.delta;
  if (delta && typeof delta === 'object') {
    return delta as Record<string, unknown>;
  }
  return undefined;
}

/** 从 Generation SSE chunk 解析 content / reasoning 增量 */
export function extractDashScopeStreamDelta(chunk: Record<string, unknown>): {
  content?: string;
  reasoning?: string;
} {
  const output = chunk.output as Record<string, unknown> | undefined;
  const choices = (output?.choices ?? chunk.choices) as unknown[] | undefined;
  const payload = getDashScopeChoicePayload(choices?.[0] as Record<string, unknown> | undefined);
  if (!payload) return {};

  const result: { content?: string; reasoning?: string } = {};
  const content = extractDashScopeStreamText(payload.content);
  if (content) result.content = content;

  const reasoning = extractDashScopeStreamText(payload.reasoning_content);
  if (reasoning) result.reasoning = reasoning;

  return result;
}
