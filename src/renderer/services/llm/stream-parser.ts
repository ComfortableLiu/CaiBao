import type { SearchResultItem } from '@shared/types';

interface RawSearchResult {
  index?: number;
  title?: string;
  url?: string;
  site_name?: string;
  icon?: string;
}

interface RawSearchInfo {
  search_results?: RawSearchResult[];
}

function normalizeSearchResults(raw: RawSearchResult[]): SearchResultItem[] {
  return raw
    .filter((r) => r.title && r.url)
    .map((r, i) => ({
      index: r.index ?? i + 1,
      title: r.title!,
      url: r.url!,
      site_name: r.site_name,
      icon: r.icon,
    }));
}

/** 从 DashScope / OpenAI 兼容流式 chunk 中提取 search_info */
export function extractSearchResultsFromChunk(chunk: unknown): SearchResultItem[] | undefined {
  const c = chunk as Record<string, unknown>;
  const candidates: RawSearchInfo[] = [];

  if (c.search_info && typeof c.search_info === 'object') {
    candidates.push(c.search_info as RawSearchInfo);
  }

  const output = c.output as Record<string, unknown> | undefined;
  if (output?.search_info && typeof output.search_info === 'object') {
    candidates.push(output.search_info as RawSearchInfo);
  }

  const choices = c.choices as unknown[] | undefined;
  const first = choices?.[0] as Record<string, unknown> | undefined;
  if (first?.search_info && typeof first.search_info === 'object') {
    candidates.push(first.search_info as RawSearchInfo);
  }

  for (const info of candidates) {
    const list = info.search_results;
    if (list && list.length > 0) {
      return normalizeSearchResults(list);
    }
  }

  return undefined;
}
