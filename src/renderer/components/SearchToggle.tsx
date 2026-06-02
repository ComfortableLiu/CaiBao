interface Props {
  enabled: boolean;
  disabled?: boolean;
  unavailableReason?: string;
  onChange: (enabled: boolean) => void;
}

export function SearchToggle({ enabled, disabled, unavailableReason, onChange }: Props) {
  const isDisabled = disabled || Boolean(unavailableReason);
  const title = unavailableReason
    ? unavailableReason
    : enabled
      ? '已开启联网搜索'
      : '点击开启联网搜索';

  return (
    <button
      type="button"
      className={`search-toggle ${enabled && !unavailableReason ? 'active' : ''}`}
      disabled={isDisabled}
      onClick={() => onChange(!enabled)}
      title={title}
      aria-pressed={enabled && !unavailableReason}
    >
      <span className="search-toggle-icon" aria-hidden>
        ◎
      </span>
      <span>联网搜索</span>
    </button>
  );
}
