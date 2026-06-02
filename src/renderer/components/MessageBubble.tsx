import { useEffect, useState } from 'react';
import type { Message } from '@shared/types';
import { MarkdownContent } from './MarkdownContent';
import { SearchResultsBlock } from './SearchResultsBlock';
import { useChatStore } from '../stores/chat-store';
import { formatDuration } from '../utils/format-duration';

interface Props {
  message: Message;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RetryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function MessageBubble({ message }: Props) {
  const setCopyToast = useChatStore((s) => s.setCopyToast);
  const retryAssistantMessage = useChatStore((s) => s.retryAssistantMessage);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const isStreaming = streamingMessageId === message.id;
  const isStreamingThisConv = useChatStore((s) => s.isStreaming);
  const [liveDurationMs, setLiveDurationMs] = useState<number | undefined>(message.durationMs);

  useEffect(() => {
    setLiveDurationMs(message.durationMs);
  }, [message.durationMs]);

  useEffect(() => {
    if (!isStreaming || !message.responseStartedAt) return;
    const start = new Date(message.responseStartedAt).getTime();
    const tick = () => setLiveDurationMs(Date.now() - start);
    tick();
    const timer = window.setInterval(tick, 200);
    return () => window.clearInterval(timer);
  }, [isStreaming, message.responseStartedAt]);

  const searchLines =
    message.searchResults?.map((r) => `[${r.index}] ${r.title} ${r.url}`).join('\n') ?? '';

  const copyText =
    message.role === 'assistant'
      ? [
          message.searchResults?.length ? `【联网搜索】\n${searchLines}` : '',
          message.reasoning ? `【思考】\n${message.reasoning}` : '',
          `【回复】\n${message.content}`,
        ]
          .filter(Boolean)
          .join('\n\n')
      : message.content;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopyToast('已复制到剪贴板');
    setTimeout(() => setCopyToast(null), 2000);
  };

  const total = message.usage?.total;

  return (
    <div
      id={`message-${message.id}`}
      data-message-role={message.role}
      data-message-id={message.id}
      data-message-text={
        message.role === 'user' ? message.content.replace(/\s+/g, ' ').trim() : ''
      }
      className={`message-row ${message.role}`}
    >
      <div className="message-bubble">
        {message.role === 'assistant' && (
          <SearchResultsBlock
            results={message.searchResults}
            hasReply={Boolean(message.content && message.content !== '…')}
          />
        )}
        {message.role === 'assistant' && message.reasoning && (
          <details className="reasoning-block" open={!message.content}>
            <summary>思考过程</summary>
            <div className="reasoning-content">{message.reasoning}</div>
          </details>
        )}
        {message.role === 'user' ? (
          <div className="user-message-text">{message.content}</div>
        ) : (
          <MarkdownContent content={message.content || '…'} />
        )}
      </div>
      {message.role === 'assistant' && message.error && (
        <div className="message-error-bar">
          <span className="message-error-text" title={message.error}>
            {message.error}
          </span>
          <button
            type="button"
            className="message-retry-btn"
            disabled={isStreamingThisConv}
            onClick={() => void retryAssistantMessage(message.id)}
            title={isStreamingThisConv ? '请等待当前生成结束' : '重试'}
            aria-label="重试"
          >
            <RetryIcon />
          </button>
        </div>
      )}
      <div className="message-footer">
        <span>{formatTime(message.createdAt)}</span>
        {message.role === 'assistant' && message.model && (
          <span>{message.model}</span>
        )}
        {message.role === 'assistant' && liveDurationMs != null && (
          <span className="message-duration" title="从首次响应到生成结束">
            {isStreaming ? '生成中 ' : '耗时 '}
            {formatDuration(liveDurationMs)}
          </span>
        )}
        {message.role === 'assistant' && message.usage && (
          <span className="token-summary">
            {total ?? 0} Token
            <span className="token-tooltip" role="tooltip">
              <span className="token-tooltip-title">Token 用量明细</span>
              <span className="token-tooltip-row">
                <span>输入</span>
                <span>{message.usage.prompt}</span>
              </span>
              <span className="token-tooltip-row">
                <span>输出</span>
                <span>{message.usage.completion}</span>
              </span>
              <span className="token-tooltip-row token-tooltip-total">
                <span>合计</span>
                <span>{message.usage.total}</span>
              </span>
            </span>
          </span>
        )}
        {message.aborted && <span>已中止</span>}
        <button type="button" className="copy-btn" onClick={() => void handleCopy()}>
          复制
        </button>
      </div>
    </div>
  );
}
