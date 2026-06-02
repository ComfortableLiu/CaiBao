import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  AppMeta,
  AppSettings,
  Conversation,
  ConversationMeta,
  Message,
  SettingsSaveInput,
} from '@shared/types';

const api = {
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.settings.get),
    save: (input: SettingsSaveInput): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC.settings.save, input),
  },
  storage: {
    getMeta: (): Promise<AppMeta> => ipcRenderer.invoke(IPC.storage.metaGet),
    setMeta: (meta: AppMeta): Promise<AppMeta> => ipcRenderer.invoke(IPC.storage.metaSet, meta),
    listConversations: (): Promise<ConversationMeta[]> =>
      ipcRenderer.invoke(IPC.storage.conversationsList),
    getConversation: (id: string): Promise<Conversation | null> =>
      ipcRenderer.invoke(IPC.storage.conversationsGet, id),
    createConversation: (conv: Conversation): Promise<Conversation> =>
      ipcRenderer.invoke(IPC.storage.conversationsCreate, conv),
    updateConversation: (conv: Conversation): Promise<Conversation> =>
      ipcRenderer.invoke(IPC.storage.conversationsUpdate, conv),
    deleteConversation: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.storage.conversationsDelete, id),
    appendMessage: (conversationId: string, message: Message): Promise<Conversation> =>
      ipcRenderer.invoke(IPC.storage.messagesAppend, conversationId, message),
    updateMessage: (conversationId: string, message: Message): Promise<Conversation> =>
      ipcRenderer.invoke(IPC.storage.messagesUpdate, conversationId, message),
  },
};

contextBridge.exposeInMainWorld('caibao', api);

export type CaibaoApi = typeof api;
