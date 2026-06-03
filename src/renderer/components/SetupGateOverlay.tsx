import type { SetupGateReason } from '@shared/settings-readiness';
import type { SettingsSection } from '@shared/settings-section';

interface Props {
  reason: SetupGateReason;
  onOpenSettings: (section: SettingsSection) => void;
}

const COPY: Record<
  NonNullable<SetupGateReason>,
  { title: string; body: string; section: SettingsSection; button: string }
> = {
  provider: {
    title: '尚未配置模型服务',
    body: '请先在设置中填写 API Key，同步模型列表，并勾选至少一个可用模型。',
    section: 'provider',
    button: '前往模型服务设置',
  },
};

export function SetupGateOverlay({ reason, onOpenSettings }: Props) {
  if (!reason) return null;
  const copy = COPY[reason];

  return (
    <div className="setup-gate-overlay" role="dialog" aria-modal="true">
      <div className="setup-gate-card">
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <button type="button" className="primary" onClick={() => onOpenSettings(copy.section)}>
          {copy.button}
        </button>
      </div>
    </div>
  );
}
