import { useEffect, useMemo } from 'react';
import { getActiveProfile, resolveProviderConfig } from '@shared/provider-config';
import { getSetupGateReason } from '@shared/settings-readiness';
import type { SettingsSection } from '@shared/settings-section';
import { useSettingsStore } from '../stores/settings-store';
import { useChatStore } from '../stores/chat-store';
import { ConversationSidebar } from '../components/ConversationSidebar';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';
import { SetupGateOverlay } from '../components/SetupGateOverlay';
import '../styles/chat.css';

interface Props {
  onOpenSettings: (section?: SettingsSection) => void;
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
  const gateReason = settings.loaded ? getSetupGateReason(settings) : null;

  const activeConversationId = activeConversation?.id ?? '';
  const hasHistoryMessages = (activeConversation?.messages.length ?? 0) > 0;

  useEffect(() => {
    if (enabledModels.length > 0 && !enabledModels.includes(selectedModelId)) {
      setSelectedModel(enabledModels[0]);
    }
  }, [enabledModels, selectedModelId, setSelectedModel]);

  return (
    <div className="chat-layout">
      <ConversationSidebar />
      <div className="chat-main">
        {gateReason && (
          <SetupGateOverlay reason={gateReason} onOpenSettings={(s) => onOpenSettings(s)} />
        )}
        <MessageList
          messages={activeConversation?.messages ?? []}
          streamingMessageId={streamingMessageId}
          scrollToBottomTrigger={hasHistoryMessages ? activeConversationId : undefined}
        />
        <Composer
          disabled={Boolean(gateReason)}
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
          onSend={(text, files) => void sendMessage(text, files)}
          focusTrigger={activeConversationId}
        />
      </div>
    </div>
  );
}
