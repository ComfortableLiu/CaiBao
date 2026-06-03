import { useEffect, useState } from 'react';
import '../styles/model-vision-dialog.css';

interface Props {
  modelId: string;
  visionEnabled: boolean;
  onSave: (vision: boolean) => void;
  onClose: () => void;
}

export function ModelVisionEditDialog({ modelId, visionEnabled, onSave, onClose }: Props) {
  const [vision, setVision] = useState(visionEnabled);

  useEffect(() => {
    setVision(visionEnabled);
  }, [visionEnabled, modelId]);

  return (
    <div className="model-vision-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="model-vision-dialog"
        role="dialog"
        aria-labelledby="model-vision-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="model-vision-dialog-title">模型能力</h3>
        <p className="model-vision-dialog-model">{modelId}</p>
        <label className="model-vision-dialog-toggle">
          <input type="checkbox" checked={vision} onChange={(e) => setVision(e.target.checked)} />
          <span>支持图片输入</span>
        </label>
        <p className="model-vision-dialog-hint">
          开启后，聊天页在选择该模型时可添加图片附件；关闭则禁用图片按钮。
        </p>
        <div className="model-vision-dialog-actions">
          <button type="button" className="secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="primary" onClick={() => onSave(vision)}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
