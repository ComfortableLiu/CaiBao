import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import {
  getThinkingUnavailableReason,
  getWebSearchUnavailableReason,
} from '@shared/model-feature-availability';
import type { ResolvedProviderConfig } from '@shared/provider-config';
import { ModelSelect } from './ModelSelect';
import { SearchToggle } from './SearchToggle';
import { ThinkingToggle } from './ThinkingToggle';

interface Props {
  disabled?: boolean;
  provider: ResolvedProviderConfig;
  models: string[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  enableThinking: boolean;
  onThinkingChange: (enabled: boolean) => void;
  enableSearch: boolean;
  onSearchChange: (enabled: boolean) => void;
  isStreaming?: boolean;
  onAbort?: () => void;
  onSend: (text: string) => void;
  focusTrigger?: string;
}

export function Composer({
  disabled,
  provider,
  models,
  selectedModelId,
  onModelChange,
  enableThinking,
  onThinkingChange,
  enableSearch,
  onSearchChange,
  isStreaming,
  onAbort,
  onSend,
  focusTrigger,
}: Props) {
  const thinkingUnavailableReason = getThinkingUnavailableReason(selectedModelId, provider);
  const searchUnavailableReason = getWebSearchUnavailableReason(selectedModelId, provider);
  const [text, setText] = useState('');
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!focusTrigger) return;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [focusTrigger]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // 中文等 IME 组字期间，Enter 用于上屏，不发送
    if (e.nativeEvent.isComposing || isComposingRef.current || e.keyCode === 229) {
      return;
    }
    e.preventDefault();
    submit();
  };

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={onKeyDown}
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          rows={2}
          disabled={disabled}
        />
        <div className="composer-footer">
          <div className="composer-footer-left">
            {isStreaming && onAbort && (
              <button type="button" className="composer-abort" onClick={onAbort}>
                停止
              </button>
            )}
          </div>
          <div className="composer-footer-right">
            <ThinkingToggle
              enabled={enableThinking}
              disabled={disabled}
              unavailableReason={thinkingUnavailableReason}
              onChange={onThinkingChange}
            />
            <SearchToggle
              enabled={enableSearch}
              disabled={disabled}
              unavailableReason={searchUnavailableReason}
              onChange={onSearchChange}
            />
            <ModelSelect
              models={models}
              value={selectedModelId}
              disabled={disabled}
              onChange={onModelChange}
            />
            <button
              type="button"
              className="composer-send"
              disabled={disabled || !text.trim()}
              onClick={submit}
              title="发送"
              aria-label="发送"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
