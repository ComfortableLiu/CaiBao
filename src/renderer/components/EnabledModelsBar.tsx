import { useState } from 'react';
import '../styles/enabled-models.css';

interface Props {
  modelIds: string[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onReorder: (ids: string[]) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
  hint?: string;
}

export function EnabledModelsBar({
  modelIds,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
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
        {modelIds.map((id, index) => (
          <li
            key={id}
            className={[
              'enabled-model-chip',
              selectedId === id ? 'selected' : '',
              dragIndex === index ? 'dragging' : '',
              overIndex === index ? 'drag-over' : '',
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
            >
              {id}
            </button>
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
        ))}
      </ul>
    </div>
  );
}
