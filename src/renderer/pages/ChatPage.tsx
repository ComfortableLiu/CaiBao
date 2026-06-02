import { useEffect, useMemo } from 'react';
import { getActiveProfile, resolveProviderConfig } from '@shared/provider-config';
import { useSettingsStore, hasEnabledModel } from '../stores/settings-store';
import { useChatStore } from '../stores/chat-store';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';
import '../styles/chat.css';

interface Props {
  onOpenSettings: () => void;
}

export function ChatPage({ onOpenSettings }: Props) {
  const settings = useSettingsStore();
  const activeConversation = useChatStore((s) => s.activeConversation);
  const selectedModelId = useChatStore((s) => s.selectedModelId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const abortStream = useChatStore((s) => s.abortStream);
  const saveSettings = useSettingsStore((s) => s.save);

  const activeProfile = useMemo(() => getActiveProfile(settings), [settings]);
  const provider = useMemo(() => resolveProviderConfig(settings), [settings]);
  const enabledModels = activeProfile.enabledModelIds;
  const ready = hasEnabledModel();

  const activeConversationId = activeConversation?.id ?? '';
  const hasHistoryMessages = (activeConversation?.messages.length ?? 0) > 0;

  useEffect(() => {
    if (enabledModels.length > 0 && !enabledModels.includes(selectedModelId)) {
      setSelectedModel(enabledModels[0]);
    }
  }, [enabledModels, selectedModelId, setSelectedModel]);

  if (!ready) {
    return (
      <div className="chat-layout">
        <div className="setup-hint">
          <p>请先在设置中配置 API Key，并同步、勾选至少一个模型。</p>
          <button type="button" onClick={onOpenSettings}>
            前往设置
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      <ConversationSidebar />
      <div className="chat-main">
        <MessageList
          messages={activeConversation?.messages ?? []}
          streamingMessageId={streamingMessageId}
          scrollToBottomTrigger={hasHistoryMessages ? activeConversationId : undefined}
        />
        <Composer
          disabled={isStreaming}
          provider={provider}
          models={enabledModels}
          selectedModelId={selectedModelId}
          onModelChange={setSelectedModel}
          enableThinking={settings.enableThinking}
          onThinkingChange={(enabled) => void saveSettings({ enableThinking: enabled })}
          enableSearch={settings.enableSearch}
          onSearchChange={(enabled) => void saveSettings({ enableSearch: enabled })}
          isStreaming={isStreaming}
          onAbort={abortStream}
          onSend={(text) => void sendMessage(text)}
          focusTrigger={activeConversationId}
        />
      </div>
    </div>
  );
}
