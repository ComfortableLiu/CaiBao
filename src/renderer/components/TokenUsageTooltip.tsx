import { buildTokenTooltipLines } from '@shared/token-usage';
import type { TokenUsage } from '@shared/types';

interface Props {
  usage: TokenUsage;
}

export function TokenUsageTooltip({ usage }: Props) {
  const lines = buildTokenTooltipLines(usage);

  return (
    <span className="token-tooltip" role="tooltip">
      <span className="token-tooltip-title">Token 用量明细</span>
      {lines.map((line, i) => {
        if (line.kind === 'section') {
          return (
            <span key={`s-${i}`} className="token-tooltip-section">
              {line.label}
            </span>
          );
        }
        if (line.kind === 'total') {
          return (
            <span key={`t-${i}`} className="token-tooltip-row token-tooltip-total">
              <span>{line.label}</span>
              <span>{line.value.toLocaleString()}</span>
            </span>
          );
        }
        return (
          <span
            key={`r-${i}`}
            className={`token-tooltip-row${line.sub ? ' token-tooltip-row-sub' : ''}`}
          >
            <span>{line.label}</span>
            <span>{line.value.toLocaleString()}</span>
          </span>
        );
      })}
    </span>
  );
}
