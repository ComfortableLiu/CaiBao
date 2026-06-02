interface Props {
  models: string[];
  value: string;
  disabled?: boolean;
  onChange: (modelId: string) => void;
}

function shortName(id: string): string {
  const parts = id.split('/');
  const name = parts[parts.length - 1] ?? id;
  return name.length > 28 ? `${name.slice(0, 26)}…` : name;
}

export function ModelSelect({ models, value, disabled, onChange }: Props) {
  if (models.length === 0) return null;

  return (
    <div className="model-select-wrap">
      <select
        className="model-select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        title={value}
      >
        {models.map((id) => (
          <option key={id} value={id}>
            {shortName(id)}
          </option>
        ))}
      </select>
      <span className="model-select-chevron" aria-hidden>
        ▾
      </span>
    </div>
  );
}
