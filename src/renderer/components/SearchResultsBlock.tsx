import type { SearchResultItem } from '@shared/types';

interface Props {
  results?: SearchResultItem[];
  hasReply?: boolean;
}

export function SearchResultsBlock({ results, hasReply }: Props) {
  if (!results || results.length === 0) return null;

  return (
    <details className="search-block" open={!hasReply}>
      <summary>联网搜索 · 已阅读 {results.length} 个来源</summary>
      <ul className="search-results-list">
        {results.map((item) => (
          <li key={`${item.index}-${item.url}`}>
            <span className="search-index">[{item.index}]</span>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
            {item.site_name && <span className="search-site"> — {item.site_name}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
