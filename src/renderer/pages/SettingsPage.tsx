import { useEffect, useState } from 'react';
import {
  SETTINGS_SECTION_LABELS,
  type SettingsSection,
} from '@shared/settings-section';
import { ChatPreferencesPanel } from '../components/settings/ChatPreferencesPanel';
import { ObjectStorageSettingsPanel } from '../components/settings/ObjectStorageSettingsPanel';
import { ProviderSettingsPanel } from '../components/settings/ProviderSettingsPanel';
import '../styles/settings.css';

const SECTIONS: SettingsSection[] = ['provider', 'object-storage', 'preferences'];

interface Props {
  initialSection?: SettingsSection;
}

export function SettingsPage({ initialSection = 'provider' }: Props) {
  const [section, setSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  return (
    <div className="settings-layout">
      <nav className="settings-sidebar" aria-label="设置目录">
        {SECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            className={`settings-nav-item ${section === id ? 'active' : ''}`}
            onClick={() => setSection(id)}
          >
            {SETTINGS_SECTION_LABELS[id]}
          </button>
        ))}
      </nav>
      <div className="settings-content">
        {section === 'provider' && <ProviderSettingsPanel />}
        {section === 'object-storage' && <ObjectStorageSettingsPanel />}
        {section === 'preferences' && <ChatPreferencesPanel />}
      </div>
    </div>
  );
}
