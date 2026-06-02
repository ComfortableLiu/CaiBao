import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Conversation,
  ConversationMeta,
  Message,
  SearchResultItem,
  TokenUsage,
} from '@shared/types';
import { getActiveProfile, resolveProviderConfig } from '@shared/provider-config';
import { getApi } from '../services/api';
import { fallbackTitle, generateTitle, streamChatCompletion } from '../services/llm/chat-service';
import { useSettingsStore } from './settings-store';

interface ChatState {
  conversations: ConversationMeta[];
  activeId: string | null;
  activeConversation: Conversation | null;
  isDraft: boolean;
  selectedModelId: string;
  streamingMessageId: string | null;
  isStreaming: boolean;
  /** 后台正在生成的会话 ID */
  backgroundStreamingIds: string[];
  copyToast: string | null;
  loadConversations: () => Promise<void>;
  restoreLastConversation: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  openNewChat: () => void;
  deleteConversation: (id: string) => Promise<void>;
  setSelectedModel: (modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  retryAssistantMessage: (assistantId: string) => Promise<void>;
  abortStream: () => void;
  setCopyToast: (msg: string | null) => void;
}

type ChatHistoryItem = { role: 'user' | 'assistant'; content: string };

interface StartAssistantStreamParams {
  conversationId: string;
  assistantId: string;
  assistantTemplate: Message;
  model: string;
  history: ChatHistoryItem[];
  startedAsDraft: boolean;
  isFirstMessage: boolean;
  titleUserContent?: string;
  get: () => ChatState;
  set: (partial: Partial<ChatState>) => void;
}

/** 按会话维度的流式请求控制（切换会话不中断） */
const streamControllers = new Map<string, AbortController>();

/** 流式进行中的会话快照（含未落盘的草稿） */
const inFlightConversations = new Map<string, Conversation>();

/** 会话 → 当前正在生成的 assistant 消息 ID */
const streamingAssistantIds = new Map<string, string>();

function createEmptyDraft(modelId: string): Conversation {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: '新对话',
    createdAt: now,
    updatedAt: now,
    modelId,
    messages: [],
  };
}

function hasCompletedRound(conv: Conversation): boolean {
  return conv.messages.some((m) => m.role === 'user') && conv.messages.some((m) => m.role === 'assistant');
}

function listBackgroundStreamingIds(): string[] {
  return [...streamControllers.keys()];
}

function syncActiveStreamingUi(
  set: (partial: Partial<ChatState>) => void,
  get: () => ChatState,
): void {
  const activeConvId = get().isDraft ? get().activeConversation?.id : get().activeId;
  const assistantId = activeConvId ? streamingAssistantIds.get(activeConvId) : undefined;
  const streaming = Boolean(activeConvId && streamControllers.has(activeConvId));
  set({
    isStreaming: streaming,
    streamingMessageId: streaming ? assistantId ?? null : null,
    backgroundStreamingIds: listBackgroundStreamingIds(),
  });
}

function patchInFlightConversation(conversationId: string, updater: (conv: Conversation) => Conversation): void {
  const current =
    inFlightConversations.get(conversationId) ??
    useChatStore.getState().activeConversation;
  if (!current || current.id !== conversationId) return;
  inFlightConversations.set(conversationId, updater(current));
}

function messagesToHistory(messages: Message[], excludeAssistantId: string): ChatHistoryItem[] {
  return messages
    .filter((m) => m.id !== excludeAssistantId)
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.error ? '' : m.content,
    }));
}

function startAssistantStream(params: StartAssistantStreamParams): void {
  const {
    conversationId,
    assistantId,
    assistantTemplate,
    model,
    history,
    startedAsDraft,
    isFirstMessage,
    titleUserContent,
    get,
    set,
  } = params;

  const settings = useSettingsStore.getState();
  const provider = resolveProviderConfig(settings);

  const controller = new AbortController();
  streamControllers.set(conversationId, controller);
  streamingAssistantIds.set(conversationId, assistantId);

  let reasoning = '';
  let body = '';
  let apiError: string | undefined;
  let searchResults: SearchResultItem[] | undefined;
  let searchStatus: Message['searchStatus'] | undefined;
  let usage: TokenUsage | undefined;
  let responseStartedAt: string | undefined;
  const requestStartedAt = Date.now();

  const applyAssistantPatch = (durationMs?: number) => {
    patchInFlightConversation(conversationId, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: body,
              reasoning: reasoning || undefined,
              searchResults,
              searchStatus,
              responseStartedAt,
              durationMs,
              usage,
              error: undefined,
            }
          : m,
      ),
      updatedAt: new Date().toISOString(),
    }));

    const updated = inFlightConversations.get(conversationId);
    if (!updated) return;

    if (get().activeConversation?.id === conversationId) {
      set({ activeConversation: updated });
    }
    syncActiveStreamingUi(set, get);
  };

  const enableThinking = settings.enableThinking;
  const enableSearch = settings.enableSearch;

  syncActiveStreamingUi(set, get);

  void streamChatCompletion(
    provider,
    {
      model,
      messages: history,
      enableThinking,
      enableSearch,
      signal: controller.signal,
    },
    {
      onDelta: (delta) => {
        if (!responseStartedAt) {
          responseStartedAt = new Date().toISOString();
        }
        if (delta.reasoning) reasoning += delta.reasoning;
        if (delta.content) body += delta.content;
        if (delta.searchResults) searchResults = delta.searchResults;
        if (delta.searchStatus) searchStatus = delta.searchStatus;
        if (delta.usage) usage = delta.usage;
        const elapsed = responseStartedAt
          ? Date.now() - new Date(responseStartedAt).getTime()
          : undefined;
        applyAssistantPatch(elapsed);
      },
      onDone: (u) => {
        usage = u;
      },
      onError: (err) => {
        apiError = err.message;
      },
    },
  ).then(async () => {
    streamControllers.delete(conversationId);
    streamingAssistantIds.delete(conversationId);

    const aborted = controller.signal.aborted;
    const durationMs = responseStartedAt
      ? Date.now() - new Date(responseStartedAt).getTime()
      : Date.now() - requestStartedAt;

    const trimmedBody = body.trim();
    const finalMsg: Message = {
      ...assistantTemplate,
      content: apiError && !trimmedBody ? '请求失败' : trimmedBody || (apiError ? '请求失败' : '(无内容)'),
      reasoning: reasoning || undefined,
      searchResults,
      searchStatus: searchResults?.length ? 'done' : undefined,
      responseStartedAt,
      durationMs,
      usage,
      aborted,
      error: apiError,
    };

    let finalConv = inFlightConversations.get(conversationId);
    if (!finalConv) {
      finalConv = (await getApi().storage.getConversation(conversationId)) ?? undefined;
    }
    if (!finalConv) {
      syncActiveStreamingUi(set, get);
      return;
    }

    finalConv = {
      ...finalConv,
      messages: finalConv.messages.map((m) => (m.id === assistantId ? finalMsg : m)),
      updatedAt: new Date().toISOString(),
    };

    const persistDraft = startedAsDraft && hasCompletedRound(finalConv);

    const scheduleTitle = (saved: Conversation) => {
      if (!isFirstMessage || !titleUserContent) return;
      void (async () => {
        try {
          const title = await generateTitle(provider, model, titleUserContent);
          const updated = { ...saved, title };
          await getApi().storage.updateConversation(updated);
          inFlightConversations.set(conversationId, updated);
          if (get().activeConversation?.id === conversationId) {
            set({ activeConversation: updated });
          }
          await get().loadConversations();
        } catch {
          const title = fallbackTitle(titleUserContent);
          const updated = { ...saved, title };
          await getApi().storage.updateConversation(updated);
          inFlightConversations.set(conversationId, updated);
          await get().loadConversations();
        }
      })();
    };

    if (persistDraft) {
      await getApi().storage.createConversation(finalConv);
      inFlightConversations.set(conversationId, finalConv);
      if (get().activeConversation?.id === conversationId) {
        set({ activeId: finalConv.id, activeConversation: finalConv, isDraft: false });
        await getApi().storage.setMeta({ lastOpenedConversationId: finalConv.id });
      }
      await get().loadConversations();
      scheduleTitle(finalConv);
    } else if (startedAsDraft) {
      inFlightConversations.set(conversationId, finalConv);
      if (get().activeConversation?.id === conversationId) {
        set({ activeConversation: finalConv });
      }
    } else {
      finalConv = await getApi().storage.updateMessage(finalConv.id, finalMsg);
      inFlightConversations.set(conversationId, finalConv);
      if (get().activeConversation?.id === conversationId) {
        set({ activeConversation: finalConv });
      }
      await get().loadConversations();
      scheduleTitle(finalConv);
    }

    inFlightConversations.delete(conversationId);
    syncActiveStreamingUi(set, get);
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  activeConversation: null,
  isDraft: false,
  selectedModelId: '',
  streamingMessageId: null,
  isStreaming: false,
  backgroundStreamingIds: [],
  copyToast: null,

  loadConversations: async () => {
    const list = await getApi().storage.listConversations();
    set({ conversations: list, backgroundStreamingIds: listBackgroundStreamingIds() });
  },

  restoreLastConversation: async () => {
    const meta = await getApi().storage.getMeta();
    await get().loadConversations();
    const { conversations } = get();
    const targetId =
      meta.lastOpenedConversationId &&
      conversations.some((c) => c.id === meta.lastOpenedConversationId)
        ? meta.lastOpenedConversationId
        : conversations[0]?.id;
    if (targetId) {
      await get().selectConversation(targetId);
    } else {
      get().openNewChat();
    }
  },

  selectConversation: async (id) => {
    const inFlight = inFlightConversations.get(id);
    const conv = inFlight ?? (await getApi().storage.getConversation(id));
    await getApi().storage.setMeta({ lastOpenedConversationId: id });
    const profile = getActiveProfile(useSettingsStore.getState());
    const modelId = conv?.modelId ?? profile.enabledModelIds[0] ?? '';
    set({
      activeId: id,
      activeConversation: conv,
      isDraft: false,
      selectedModelId: modelId,
    });
    syncActiveStreamingUi(set, get);
  },

  openNewChat: () => {
    const { isDraft, activeConversation } = get();
    if (isDraft && activeConversation && activeConversation.messages.length === 0) {
      syncActiveStreamingUi(set, get);
      return;
    }

    const settings = useSettingsStore.getState();
    const profile = getActiveProfile(settings);
    const modelId = get().selectedModelId || profile.enabledModelIds[0] || '';
    const draft = createEmptyDraft(modelId);
    set({
      activeId: null,
      activeConversation: draft,
      isDraft: true,
      selectedModelId: modelId,
    });
    void getApi().storage.setMeta({ lastOpenedConversationId: null });
    syncActiveStreamingUi(set, get);
  },

  deleteConversation: async (id) => {
    streamControllers.get(id)?.abort();
    streamControllers.delete(id);
    inFlightConversations.delete(id);
    streamingAssistantIds.delete(id);

    await getApi().storage.deleteConversation(id);
    const { activeId } = get();
    await get().loadConversations();
    if (activeId === id) {
      const next = get().conversations[0];
      if (next) {
        await get().selectConversation(next.id);
      } else {
        get().openNewChat();
      }
    } else {
      syncActiveStreamingUi(set, get);
    }
  },

  setSelectedModel: (modelId) => {
    set({ selectedModelId: modelId });
    const { activeConversation, isDraft } = get();
    if (!activeConversation) return;
    const updated = { ...activeConversation, modelId };
    set({ activeConversation: updated });
    if (!isDraft) {
      void getApi().storage.updateConversation(updated);
    } else {
      inFlightConversations.set(updated.id, updated);
    }
  },

  abortStream: () => {
    const convId = get().isDraft ? get().activeConversation?.id : get().activeId;
    if (!convId) return;
    streamControllers.get(convId)?.abort();
  },

  setCopyToast: (msg) => set({ copyToast: msg }),

  sendMessage: async (content) => {
    const settings = useSettingsStore.getState();
    const provider = resolveProviderConfig(settings);
    const profile = getActiveProfile(settings);
    if (!provider.apiKey) return;

    let { activeConversation, isDraft, selectedModelId } = get();
    if (!activeConversation) {
      get().openNewChat();
      activeConversation = get().activeConversation;
      isDraft = get().isDraft;
    }
    if (!activeConversation) return;

    const model = selectedModelId || profile.enabledModelIds[0];
    if (!model) return;

    const conversationId = activeConversation.id;
    const startedAsDraft = isDraft;
    const userMsg: Message = {
      id: uuidv4(),
      conversationId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const assistantId = uuidv4();
    const assistantDraft: Message = {
      id: assistantId,
      conversationId,
      role: 'assistant',
      content: '',
      reasoning: '',
      model,
      createdAt: new Date().toISOString(),
    };

    const isFirstMessage = activeConversation.messages.length === 0;

    let conv: Conversation = {
      ...activeConversation,
      modelId: model,
      updatedAt: new Date().toISOString(),
      messages: [...activeConversation.messages, userMsg, assistantDraft],
    };

    if (!isDraft) {
      conv = await getApi().storage.appendMessage(conversationId, userMsg);
      conv = await getApi().storage.appendMessage(conv.id, assistantDraft);
    }

    inFlightConversations.set(conversationId, conv);
    set({ activeConversation: conv });

    const history = messagesToHistory(conv.messages, assistantId);

    startAssistantStream({
      conversationId,
      assistantId,
      assistantTemplate: assistantDraft,
      model,
      history,
      startedAsDraft,
      isFirstMessage,
      titleUserContent: content,
      get,
      set,
    });
  },

  retryAssistantMessage: async (assistantId) => {
    const settings = useSettingsStore.getState();
    const provider = resolveProviderConfig(settings);
    if (!provider.apiKey) return;

    let { activeConversation, isDraft, selectedModelId } = get();
    if (!activeConversation) return;

    const conversationId = activeConversation.id;
    if (streamControllers.has(conversationId)) return;

    const assistantIndex = activeConversation.messages.findIndex((m) => m.id === assistantId);
    if (assistantIndex < 0) return;

    const assistant = activeConversation.messages[assistantIndex];
    if (assistant.role !== 'assistant' || !assistant.error) return;

    const model = selectedModelId || assistant.model || getActiveProfile(settings).enabledModelIds[0];
    if (!model) return;

    const resetAssistant: Message = {
      ...assistant,
      model,
      content: '',
      reasoning: undefined,
      error: undefined,
      searchResults: undefined,
      searchStatus: undefined,
      usage: undefined,
      responseStartedAt: undefined,
      durationMs: undefined,
      aborted: false,
    };

    let conv: Conversation = {
      ...activeConversation,
      modelId: model,
      updatedAt: new Date().toISOString(),
      messages: activeConversation.messages.map((m) =>
        m.id === assistantId ? resetAssistant : m,
      ),
    };

    if (!isDraft) {
      conv = await getApi().storage.updateMessage(conversationId, resetAssistant);
    }

    inFlightConversations.set(conversationId, conv);
    set({ activeConversation: conv });

    const history = messagesToHistory(conv.messages.slice(0, assistantIndex), assistantId);

    startAssistantStream({
      conversationId,
      assistantId,
      assistantTemplate: resetAssistant,
      model,
      history,
      startedAsDraft: isDraft,
      isFirstMessage: false,
      get,
      set,
    });
  },
}));