import type { ThemeMode } from '@shared/types';
import { useSettingsStore } from '../../stores/settings-store';
import { applyTheme } from '../../utils/theme';

export function ChatPreferencesPanel() {
  const settings = useSettingsStore();
  const save = useSettingsStore((s) => s.save);

  const setTheme = async (theme: ThemeMode) => {
    await save({ theme });
    applyTheme(theme);
  };

  return (
    <div className="settings-panel">
      <h2>聊天偏好</h2>
      <section className="appearance-section">
        <h3>外观</h3>
        <div className="theme-options">
          {(
            [
              ['light', '白天模式'],
              ['dark', '黑暗模式'],
              ['system', '跟随系统'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="theme-option">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={settings.theme === value}
                onChange={() => void setTheme(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3>默认能力开关</h3>
        <p className="provider-mode-hint">可在聊天页 Composer 中临时切换；此处为全局默认值。</p>
        <label className="pref-toggle">
          <input
            type="checkbox"
            checked={settings.enableThinking}
            onChange={(e) => void save({ enableThinking: e.target.checked })}
          />
          <span>深度思考（enable_thinking）</span>
        </label>
        <label className="pref-toggle">
          <input
            type="checkbox"
            checked={settings.enableSearch}
            onChange={(e) => void save({ enableSearch: e.target.checked })}
          />
          <span>联网搜索（enable_search）</span>
        </label>
      </section>
    </div>
  );
}
