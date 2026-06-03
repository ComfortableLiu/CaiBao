import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { ImageOff } from 'lucide-react';
import type { MessageAttachment } from '@shared/types';
import {
  buildAttachmentImageErrorDetail,
  type AttachmentImageErrorDetail,
} from '../utils/attachment-image-error';

interface Props {
  attachment: MessageAttachment;
}

function AttachmentImageErrorDialog({
  detail,
  onClose,
}: {
  detail: AttachmentImageErrorDetail;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="message-attachment-error-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="message-attachment-error-dialog"
        role="dialog"
        aria-labelledby="attachment-error-dialog-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="attachment-error-dialog-title">图片加载失败</h3>
        <p className="message-attachment-error-summary">{detail.summary}</p>
        <dl className="message-attachment-error-details">
          {detail.lines.map((line) => (
            <div key={line.label} className="message-attachment-error-row">
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
        <div className="message-attachment-error-actions">
          <button type="button" className="primary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function MessageAttachmentImage({ attachment }: Props) {
  const [failed, setFailed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const detail = buildAttachmentImageErrorDetail(attachment);

  useEffect(() => {
    setFailed(false);
    setShowDetail(false);
  }, [attachment.url]);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  const openDetail = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowDetail(true);
    },
    [],
  );

  if (failed) {
    return (
      <>
        <button
          type="button"
          className="message-attachment-fallback"
          onClick={openDetail}
          title="点击查看失败详情"
          aria-label="图片打开失败，点击查看详情"
        >
          <ImageOff size={28} strokeWidth={1.5} aria-hidden />
          <span className="message-attachment-fallback-text">图片打开失败</span>
        </button>
        {showDetail && (
          <AttachmentImageErrorDialog detail={detail} onClose={() => setShowDetail(false)} />
        )}
      </>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="message-attachment-link"
    >
      <img
        src={attachment.url}
        alt={attachment.fileName ?? '图片'}
        className="message-attachment-img"
        onError={handleError}
      />
    </a>
  );
}
