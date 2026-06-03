import { lazy, Suspense, useEffect, useState } from 'react';
import { useSettingsStore } from './stores/settings-store';
import { useChatStore } from './stores/chat-store';
import { applyTheme, watchSystemTheme } from './utils/theme';
import type { SettingsSection } from '@shared/settings-section';
import './styles/app.css';

const ChatPage = lazy(() =>
  import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

type Tab = 'chat' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('provider');
  const loadSettings = useSettingsStore((s) => s.load);
  const theme = useSettingsStore((s) => s.theme);
  const restore = useChatStore((s) => s.restoreLastConversation);
  const copyToast = useChatStore((s) => s.copyToast);

  const openSettings = (section: SettingsSection = 'provider') => {
    setSettingsSection(section);
    setTab('settings');
  };

  useEffect(() => {
    void (async () => {
      await loadSettings();
      await restore();
    })();
  }, [loadSettings, restore]);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    return watchSystemTheme(() => applyTheme('system'));
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="app-nav">
        <h1>菜包</h1>
        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
          >
            聊天
          </button>
          <button
            type="button"
            className={`nav-tab ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => openSettings('provider')}
          >
            设置
          </button>
        </div>
      </header>
      <main className="app-main">
        <Suspense fallback={<div className="app-route-loading">加载中…</div>}>
          {tab === 'chat' ? (
            <ChatPage onOpenSettings={openSettings} />
          ) : (
            <SettingsPage initialSection={settingsSection} />
          )}
        </Suspense>
      </main>
      {copyToast && <div className="toast">{copyToast}</div>}
    </div>
  );
}
