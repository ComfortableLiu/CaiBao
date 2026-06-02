import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type { AppMeta, Conversation, ConversationMeta, Message } from '@shared/types';

function dataRoot(): string {
  return path.join(app.getPath('userData'), 'caibao');
}

function conversationsDir(): string {
  return path.join(dataRoot(), 'conversations');
}

function metaPath(): string {
  return path.join(dataRoot(), 'meta.json');
}

function conversationPath(id: string): string {
  return path.join(conversationsDir(), `${id}.json`);
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(conversationsDir(), { recursive: true });
}

export class StorageService {
  async init(): Promise<void> {
    await ensureDirs();
  }

  async getMeta(): Promise<AppMeta> {
    try {
      const raw = await fs.readFile(metaPath(), 'utf-8');
      return JSON.parse(raw) as AppMeta;
    } catch {
      return { lastOpenedConversationId: null };
    }
  }

  async setMeta(meta: AppMeta): Promise<void> {
    await ensureDirs();
    await fs.writeFile(metaPath(), JSON.stringify(meta, null, 2), 'utf-8');
  }

  async listConversations(): Promise<ConversationMeta[]> {
    await ensureDirs();
    const files = await fs.readdir(conversationsDir());
    const metas: ConversationMeta[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const conv = await this.getConversation(path.basename(file, '.json'));
      if (conv) {
        metas.push({
          id: conv.id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          modelId: conv.modelId,
        });
      }
    }
    return metas.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const raw = await fs.readFile(conversationPath(id), 'utf-8');
      return JSON.parse(raw) as Conversation;
    } catch {
      return null;
    }
  }

  async createConversation(conv: Conversation): Promise<Conversation> {
    await ensureDirs();
    await fs.writeFile(conversationPath(conv.id), JSON.stringify(conv, null, 2), 'utf-8');
    return conv;
  }

  async updateConversation(conv: Conversation): Promise<Conversation> {
    conv.updatedAt = new Date().toISOString();
    await fs.writeFile(conversationPath(conv.id), JSON.stringify(conv, null, 2), 'utf-8');
    return conv;
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      await fs.unlink(conversationPath(id));
    } catch {
      /* ignore */
    }
  }

  async appendMessage(conversationId: string, message: Message): Promise<Conversation> {
    const conv = await this.getConversation(conversationId);
    if (!conv) throw new Error(`Conversation not found: ${conversationId}`);
    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    return this.updateConversation(conv);
  }

  async updateMessage(conversationId: string, message: Message): Promise<Conversation> {
    const conv = await this.getConversation(conversationId);
    if (!conv) throw new Error(`Conversation not found: ${conversationId}`);
    const idx = conv.messages.findIndex((m) => m.id === message.id);
    if (idx === -1) throw new Error(`Message not found: ${message.id}`);
    conv.messages[idx] = message;
    conv.updatedAt = new Date().toISOString();
    return this.updateConversation(conv);
  }
}
