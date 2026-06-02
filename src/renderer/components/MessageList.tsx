import { useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '@shared/types';
import { MessageBubble } from './MessageBubble';

interface Props {
  messages: Message[];
  streamingMessageId: string | null;
  scrollToBottomTrigger?: string;
}

const SCROLL_BOTTOM_THRESHOLD_PX = 80;
const STICKY_HEADER_HEIGHT_PX = 36;
const STICKY_VISIBLE_OFFSET_PX = 8;

export function MessageList({ messages, streamingMessageId, scrollToBottomTrigger }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [stickyUserInput, setStickyUserInput] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const stickyUserInputRef = useRef(stickyUserInput);
  const lastUserMessageIdRef = useRef<string | null>(null);
  const userScrollInitRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const conversationId = messages[0]?.conversationId;

  useEffect(() => {
    stickyUserInputRef.current = stickyUserInput;
  }, [stickyUserInput]);

  useEffect(() => {
    userScrollInitRef.current = false;
    lastUserMessageIdRef.current = null;
  }, [conversationId]);

  const lastUserMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') return messages[i].id;
    }
    return null;
  }, [messages]);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const scrollToUserMessageTop = (messageId: string) => {
    const container = containerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`#message-${messageId}`);
    if (!el) return;
    container.scrollTo({ top: Math.max(0, el.offsetTop - 8) });
  };

  useEffect(() => {
    if (!scrollToBottomTrigger) return;
    if (messages.length === 0) return;
    setStickToBottom(true);
    setStickyUserInput(null);
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [scrollToBottomTrigger, messages.length]);

  useEffect(() => {
    if (!lastUserMessageId) return;
    const prev = lastUserMessageIdRef.current;
    lastUserMessageIdRef.current = lastUserMessageId;

    if (!userScrollInitRef.current) {
      userScrollInitRef.current = true;
      const userCount = messages.filter((m) => m.role === 'user').length;
      // 仅一条用户消息：新对话首条发送，需要滚到底；多条则为加载历史会话，保持原位
      if (userCount <= 1) {
        setStickToBottom(true);
        setStickyUserInput(null);
      }
      return;
    }

    if (prev !== lastUserMessageId) {
      setStickToBottom(true);
      setStickyUserInput(null);
    }
  }, [lastUserMessageId, messages]);

  useEffect(() => {
    if (!stickToBottom) return;
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages, streamingMessageId, stickToBottom]);

  const handleScroll = () => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const el = containerRef.current;
      if (!el) return;

      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX;
      setStickToBottom(atBottom);

      if (atBottom) {
        if (stickyUserInputRef.current) setStickyUserInput(null);
        return;
      }

      const visibleTop = el.scrollTop + STICKY_HEADER_HEIGHT_PX + STICKY_VISIBLE_OFFSET_PX;
      const userEls = Array.from(
        el.querySelectorAll<HTMLElement>('[data-message-role="user"]'),
      );

      let best: HTMLElement | null = null;
      for (const u of userEls) {
        if (u.offsetTop <= visibleTop) {
          if (!best || u.offsetTop > best.offsetTop) best = u;
        }
      }

      const id = best?.dataset.messageId;
      const text = best?.dataset.messageText ?? '';
      const next = id ? { id, text } : null;
      const prevNextId = stickyUserInputRef.current?.id ?? null;
      if ((next?.id ?? null) !== prevNextId) {
        setStickyUserInput(next);
      }
    });
  };

  return (
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      <div
        className={`sticky-user-input ${stickyUserInput ? '' : 'hidden'}`}
        aria-hidden={!stickyUserInput}
      >
        <button
          type="button"
          className="sticky-user-input-btn"
          disabled={!stickyUserInput}
          onClick={() => {
            if (!stickyUserInput) return;
            scrollToUserMessageTop(stickyUserInput.id);
          }}
          title={stickyUserInput?.text || ''}
        >
          <span className="sticky-user-input-prefix">输入：</span>
          <span className="sticky-user-input-text">{stickyUserInput?.text || ''}</span>
        </button>
      </div>
      {messages.length === 0 ? (
        <div className="empty-hint">发送消息开始对话</div>
      ) : (
        messages.map((m) => <MessageBubble key={m.id} message={m} />)
      )}
    </div>
  );
}
