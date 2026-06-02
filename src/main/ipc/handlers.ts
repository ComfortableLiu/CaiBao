import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  AppMeta,
  AppSettings,
  Conversation,
  Message,
  SettingsSaveInput,
} from '@shared/types';
import { StorageService } from '../storage/storage-service';
import { SettingsService } from '../storage/settings-service';

export function registerIpcHandlers(
  storage: StorageService,
  settings: SettingsService,
): void {
  ipcMain.handle(IPC.settings.get, async (): Promise<AppSettings> => settings.get());

  ipcMain.handle(
    IPC.settings.save,
    async (_e, input: SettingsSaveInput): Promise<AppSettings> => settings.save(input),
  );

  ipcMain.handle(IPC.storage.metaGet, async (): Promise<AppMeta> => storage.getMeta());

  ipcMain.handle(IPC.storage.metaSet, async (_e, meta: AppMeta): Promise<AppMeta> => {
    await storage.setMeta(meta);
    return meta;
  });

  ipcMain.handle(IPC.storage.conversationsList, async () => storage.listConversations());

  ipcMain.handle(
    IPC.storage.conversationsGet,
    async (_e, id: string): Promise<Conversation | null> => storage.getConversation(id),
  );

  ipcMain.handle(
    IPC.storage.conversationsCreate,
    async (_e, conv: Conversation): Promise<Conversation> => storage.createConversation(conv),
  );

  ipcMain.handle(
    IPC.storage.conversationsUpdate,
    async (_e, conv: Conversation): Promise<Conversation> => storage.updateConversation(conv),
  );

  ipcMain.handle(IPC.storage.conversationsDelete, async (_e, id: string): Promise<void> => {
    await storage.deleteConversation(id);
  });

  ipcMain.handle(
    IPC.storage.messagesAppend,
    async (_e, conversationId: string, message: Message): Promise<Conversation> =>
      storage.appendMessage(conversationId, message),
  );

  ipcMain.handle(
    IPC.storage.messagesUpdate,
    async (_e, conversationId: string, message: Message): Promise<Conversation> =>
      storage.updateMessage(conversationId, message),
  );
}
