import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
  DragEvent,
  ClipboardEvent,
  ChangeEvent,
} from 'react';
import { ArrowUp, ImagePlus, Square } from 'lucide-react';
import {
  getThinkingUnavailableReason,
  getWebSearchUnavailableReason,
} from '@shared/model-feature-availability';
import { getObjectStorageUploadBlockReason } from '@shared/settings-readiness';
import { getVisionUnavailableReason } from '@shared/model-vision-config';
import type { ResolvedProviderConfig } from '@shared/provider-config';
import { useSettingsStore } from '../stores/settings-store';
import { ModelSelect } from './ModelSelect';
import { SearchToggle } from './SearchToggle';
import { ThinkingToggle } from './ThinkingToggle';
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  validateImageFile,
} from '../utils/attachments';

interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string;
}

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
  onSend: (text: string, imageFiles?: File[]) => void;
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
  const settings = useSettingsStore();
  const thinkingUnavailableReason = getThinkingUnavailableReason(
    selectedModelId,
    provider,
    settings,
  );
  const searchUnavailableReason = getWebSearchUnavailableReason(selectedModelId, provider);
  const visionUnavailableReason = getVisionUnavailableReason(selectedModelId, settings);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusTrigger) return;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [focusTrigger]);

  const storageBlockReason = getObjectStorageUploadBlockReason(settings);

  const addFiles = (files: FileList | File[]) => {
    const storageReason = getObjectStorageUploadBlockReason(settings);
    if (storageReason) {
      setAttachError(storageReason);
      return;
    }
    setAttachError(null);
    const list = Array.from(files);
    let next = [...pending];
    for (const file of list) {
      const err = validateImageFile(file);
      if (err) {
        setAttachError(err);
        continue;
      }
      if (next.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        setAttachError(`每条消息最多 ${MAX_ATTACHMENTS_PER_MESSAGE} 张图片`);
        break;
      }
      next = [
        ...next,
        {
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        },
      ];
    }
    setPending(next);
  };

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const submit = () => {
    const trimmed = text.trim();
    if ((!trimmed && pending.length === 0) || disabled || isStreaming) return;
    if (pending.length > 0 && storageBlockReason) {
      setAttachError(storageBlockReason);
      return;
    }
    onSend(
      trimmed,
      pending.map((p) => p.file),
    );
    setText('');
    pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPending([]);
    setAttachError(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (isStreaming) return;
    if (e.nativeEvent.isComposing || isComposingRef.current || e.keyCode === 229) {
      return;
    }
    e.preventDefault();
    submit();
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (!files?.length) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    e.preventDefault();
    addFiles(images);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const images = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (images.length > 0) addFiles(images);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const canSend = Boolean(text.trim() || pending.length > 0);
  const attachDisabled = disabled || isStreaming || Boolean(visionUnavailableReason);
  const controlsDisabled = disabled || isStreaming;

  const handlePrimaryAction = () => {
    if (isStreaming) {
      onAbort?.();
      return;
    }
    submit();
  };

  const placeholder = isStreaming
    ? '正在生成回复…（Enter 暂不可用）'
    : '输入消息，Enter 发送，Shift+Enter 换行';

  return (
    <div className="composer" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="composer-box">
        {pending.length > 0 && (
          <div className="composer-attachments">
            {pending.map((p) => (
              <div key={p.id} className="composer-attachment-thumb">
                <img src={p.previewUrl} alt="" />
                <button
                  type="button"
                  className="composer-attachment-remove"
                  onClick={() => removePending(p.id)}
                  aria-label="移除图片"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {attachError && <p className="composer-attach-error">{attachError}</p>}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={disabled}
        />
        <div className="composer-footer">
          <div className="composer-footer-left">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              hidden
              onChange={onFileChange}
            />
            <button
              type="button"
              className="composer-attach-btn"
              disabled={attachDisabled}
              title={visionUnavailableReason ?? '添加图片'}
              aria-label="添加图片"
              onClick={() => {
                if (storageBlockReason) {
                  setAttachError(storageBlockReason);
                  return;
                }
                fileInputRef.current?.click();
              }}
            >
              <ImagePlus size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="composer-footer-right">
            <ThinkingToggle
              enabled={enableThinking}
              disabled={controlsDisabled}
              unavailableReason={thinkingUnavailableReason}
              onChange={onThinkingChange}
            />
            <SearchToggle
              enabled={enableSearch}
              disabled={controlsDisabled}
              unavailableReason={searchUnavailableReason}
              onChange={onSearchChange}
            />
            <ModelSelect
              models={models}
              value={selectedModelId}
              disabled={controlsDisabled}
              onChange={onModelChange}
            />
            <button
              type="button"
              className={`composer-send ${isStreaming ? 'composer-stop' : ''}`}
              disabled={disabled || (!isStreaming && !canSend)}
              onClick={handlePrimaryAction}
              title={isStreaming ? '停止生成' : '发送'}
              aria-label={isStreaming ? '停止生成' : '发送'}
            >
              {isStreaming ? (
                <Square size={12} fill="currentColor" strokeWidth={0} aria-hidden />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
