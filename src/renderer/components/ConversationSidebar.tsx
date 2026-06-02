import { useState } from 'react';
import { useChatStore } from '../stores/chat-store';

export function ConversationSidebar() {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const backgroundStreamingIds = useChatStore((s) => s.backgroundStreamingIds);
  const openNewChat = useChatStore((s) => s.openNewChat);
  const isDraft = useChatStore((s) => s.isDraft);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    await deleteConversation(id);
    setPendingDelete(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button
          type="button"
          className={isDraft ? 'new-chat-btn active' : 'new-chat-btn'}
          onClick={() => openNewChat()}
        >
          + 新对话
        </button>
      </div>
      <div className="conversation-list">
        {conversations.map((c) => (
          <div key={c.id} className={`conversation-item ${activeId === c.id ? 'active' : ''}`}>
            <button
              type="button"
              className="select-btn"
              onClick={() => void selectConversation(c.id)}
            >
              {backgroundStreamingIds.includes(c.id) && activeId !== c.id ? '⟳ ' : ''}
              {c.title}
            </button>
            <button
              type="button"
              className="delete-btn"
              title={pendingDelete === c.id ? '再次点击确认删除' : '删除'}
              onClick={() => void handleDelete(c.id)}
            >
              {pendingDelete === c.id ? '确认' : '删'}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
