import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  AppMeta,
  AppSettings,
  AttachmentUploadInput,
  AttachmentUploadResult,
  Conversation,
  Message,
  MessageAttachment,
  ObjectStorageTestInput,
  SettingsSaveInput,
} from '@shared/types';
import {
  collectAttachmentObjectKeys,
  ObjectStorageService,
} from '../services/object-storage-service';
import { StorageService } from '../storage/storage-service';
import { SettingsService } from '../storage/settings-service';

export function registerIpcHandlers(
  storage: StorageService,
  settings: SettingsService,
  objectStorage: ObjectStorageService,
): void {
  ipcMain.handle(IPC.settings.get, async (): Promise<AppSettings> => settings.get());

  ipcMain.handle(
    IPC.settings.save,
    async (_e, input: SettingsSaveInput): Promise<AppSettings> => settings.save(input),
  );

  ipcMain.handle(
    IPC.objectStorage.testConnection,
    async (_e, input: ObjectStorageTestInput): Promise<{ ok: true }> => {
      await objectStorage.testConnection(input);
      return { ok: true };
    },
  );

  ipcMain.handle(
    IPC.objectStorage.upload,
    async (_e, input: AttachmentUploadInput): Promise<AttachmentUploadResult> =>
      objectStorage.upload(input),
  );

  ipcMain.handle(
    IPC.objectStorage.deleteByConversation,
    async (_e, conversationId: string): Promise<void> => {
      await objectStorage.deleteConversationAttachments(conversationId);
    },
  );

  ipcMain.handle(
    IPC.objectStorage.refreshUrl,
    async (_e, attachment: MessageAttachment): Promise<string> =>
      objectStorage.refreshAttachmentUrl(attachment),
  );

  ipcMain.handle(
    IPC.objectStorage.deleteKeys,
    async (_e, objectKeys: string[]): Promise<void> => {
      await objectStorage.deleteObjectKeys(objectKeys);
    },
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
    const conversation = await storage.getConversation(id);
    const attachmentKeys = collectAttachmentObjectKeys(conversation);
    await objectStorage.deleteConversationAttachments(id, attachmentKeys);
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
