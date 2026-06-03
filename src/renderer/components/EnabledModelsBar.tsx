import { useState } from 'react';
import { getModelVisionEnabled } from '@shared/model-vision-config';
import type { AppSettings } from '@shared/types';
import '../styles/enabled-models.css';

interface Props {
  modelIds: string[];
  settings: AppSettings;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onRemove?: (id: string) => void;
  onEditVision?: (id: string) => void;
  readOnly?: boolean;
  hint?: string;
}

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function EnabledModelsBar({
  modelIds,
  settings,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
  onEditVision,
  readOnly,
  hint = '拖动 ⋮⋮ 调整顺序',
}: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (modelIds.length === 0) {
    return <p className="enabled-models-empty">暂无已选模型，请在下方列表中勾选</p>;
  }

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...modelIds];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="enabled-models-bar">
      <div className="enabled-models-hint">{hint}</div>
      <ul className="enabled-models-list">
        {modelIds.map((id, index) => {
          const visionOn = getModelVisionEnabled(id, settings);
          return (
            <li
              key={id}
              className={[
                'enabled-model-chip',
                selectedId === id ? 'selected' : '',
                dragIndex === index ? 'dragging' : '',
                overIndex === index ? 'drag-over' : '',
                visionOn ? 'vision-on' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!readOnly}
              onDragStart={() => !readOnly && setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragOver={(e) => {
                if (readOnly) return;
                e.preventDefault();
                setOverIndex(index);
              }}
              onDragLeave={() => setOverIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (!readOnly) handleDrop(index);
              }}
            >
              {!readOnly && <span className="drag-handle" title="拖动排序">⋮⋮</span>}
              <button
                type="button"
                className="chip-label"
                onClick={() => onSelect?.(id)}
                disabled={!onSelect}
                title={visionOn ? '已启用图片' : '未启用图片'}
              >
                {visionOn && <span className="chip-vision-badge" aria-hidden>🖼</span>}
                {id}
              </button>
              {onEditVision && !readOnly && (
                <button
                  type="button"
                  className="chip-edit"
                  title="编辑能力"
                  aria-label={`编辑 ${id} 能力`}
                  onClick={() => onEditVision(id)}
                >
                  <EditIcon />
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  className="chip-remove"
                  title="取消启用"
                  onClick={() => onRemove(id)}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
