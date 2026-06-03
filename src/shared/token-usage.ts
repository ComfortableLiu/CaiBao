import type { TokenUsage } from './types';

/** DashScope usage 原始结构（流式 chunk） */
export interface DashScopeUsageRaw {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  image_tokens?: number;
  input_tokens_details?: {
    text_tokens?: number;
    image_tokens?: number;
  };
  output_tokens_details?: {
    text_tokens?: number;
    reasoning_tokens?: number;
  };
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
}

export function normalizeDashScopeUsage(raw: DashScopeUsageRaw | undefined): TokenUsage | undefined {
  if (!raw) return undefined;
  if (raw.total_tokens == null && raw.input_tokens == null && raw.output_tokens == null) {
    return undefined;
  }

  const prompt = raw.input_tokens ?? 0;
  const completion = raw.output_tokens ?? 0;
  const total = raw.total_tokens ?? prompt + completion;

  const imageIn =
    raw.input_tokens_details?.image_tokens ?? raw.image_tokens ?? undefined;
  const textIn = raw.input_tokens_details?.text_tokens;
  const cached = raw.prompt_tokens_details?.cached_tokens;
  const textOut = raw.output_tokens_details?.text_tokens;
  const reasoningOut = raw.output_tokens_details?.reasoning_tokens;

  const input =
    imageIn != null || textIn != null || cached != null
      ? { textTokens: textIn, imageTokens: imageIn, cachedTokens: cached }
      : undefined;

  const output =
    textOut != null || reasoningOut != null
      ? { textTokens: textOut, reasoningTokens: reasoningOut }
      : undefined;

  return { prompt, completion, total, input, output };
}

export type TokenTooltipLine =
  | { kind: 'section'; label: string }
  | { kind: 'row'; label: string; value: number; sub?: boolean }
  | { kind: 'total'; label: string; value: number };

function pushRow(
  lines: TokenTooltipLine[],
  label: string,
  value: number | undefined,
  sub = false,
): void {
  if (value == null) return;
  lines.push({ kind: 'row', label, value, sub });
}

/** 生成消息 footer 悬停明细 */
export function buildTokenTooltipLines(usage: TokenUsage): TokenTooltipLine[] {
  const lines: TokenTooltipLine[] = [{ kind: 'section', label: '输入' }];
  pushRow(lines, '合计', usage.prompt);
  if (usage.input) {
    pushRow(lines, '文本', usage.input.textTokens, true);
    pushRow(lines, '图片', usage.input.imageTokens, true);
    pushRow(lines, '缓存命中', usage.input.cachedTokens, true);
  }

  lines.push({ kind: 'section', label: '输出' });
  pushRow(lines, '合计', usage.completion);
  if (usage.output) {
    pushRow(lines, '正文', usage.output.textTokens, true);
    pushRow(lines, '思考', usage.output.reasoningTokens, true);
  }

  lines.push({ kind: 'total', label: '总计', value: usage.total });
  return lines;
}
