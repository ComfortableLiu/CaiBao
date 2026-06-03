import type { MessageAttachment } from '@shared/types';

export interface AttachmentImageErrorDetail {
  summary: string;
  lines: { label: string; value: string }[];
}

export function buildAttachmentImageErrorDetail(
  attachment: MessageAttachment,
): AttachmentImageErrorDetail {
  const lines: { label: string; value: string }[] = [
    { label: '访问地址', value: attachment.url || '（空）' },
    { label: '对象键', value: attachment.objectKey || '（未知）' },
  ];

  if (attachment.fileName) {
    lines.push({ label: '文件名', value: attachment.fileName });
  }
  if (attachment.mimeType) {
    lines.push({ label: 'MIME', value: attachment.mimeType });
  }
  if (attachment.width != null && attachment.height != null) {
    lines.push({ label: '尺寸', value: `${attachment.width} × ${attachment.height}` });
  }

  lines.push({
    label: '可能原因',
    value:
      '链接已失效（如预签名 URL 过期）、对象存储中文件已删除、存储配置变更导致地址不可达，或网络/跨域限制导致浏览器无法加载。',
  });

  return {
    summary: '图片无法从当前地址加载',
    lines,
  };
}
