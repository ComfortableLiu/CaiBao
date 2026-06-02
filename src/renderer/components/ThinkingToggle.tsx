interface Props {
  enabled: boolean;
  disabled?: boolean;
  unavailableReason?: string;
  onChange: (enabled: boolean) => void;
}

export function ThinkingToggle({ enabled, disabled, unavailableReason, onChange }: Props) {
  const isDisabled = disabled || Boolean(unavailableReason);
  const title = unavailableReason
    ? unavailableReason
    : enabled
      ? '已开启深度思考'
      : '点击开启深度思考';

  return (
    <button
      type="button"
      className={`thinking-toggle ${enabled && !unavailableReason ? 'active' : ''}`}
      disabled={isDisabled}
      onClick={() => onChange(!enabled)}
      title={title}
      aria-pressed={enabled && !unavailableReason}
    >
      <span className="thinking-toggle-icon" aria-hidden>
        ◈
      </span>
      <span>深度思考</span>
    </button>
  );
}
