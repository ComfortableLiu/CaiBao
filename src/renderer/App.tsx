import { useEffect, useState } from 'react';
import { useSettingsStore } from './stores/settings-store';
import { useChatStore } from './stores/chat-store';
import { SettingsPage } from './pages/SettingsPage';
import { ChatPage } from './pages/ChatPage';
import { applyTheme, watchSystemTheme } from './utils/theme';
import './styles/app.css';

type Tab = 'chat' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const loadSettings = useSettingsStore((s) => s.load);
  const theme = useSettingsStore((s) => s.theme);
  const restore = useChatStore((s) => s.restoreLastConversation);
  const copyToast = useChatStore((s) => s.copyToast);

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
            onClick={() => setTab('settings')}
          >
            设置
          </button>
        </div>
      </header>
      <main className="app-main">
        {tab === 'chat' ? (
          <ChatPage onOpenSettings={() => setTab('settings')} />
        ) : (
          <SettingsPage />
        )}
      </main>
      {copyToast && <div className="toast">{copyToast}</div>}
    </div>
  );
}
