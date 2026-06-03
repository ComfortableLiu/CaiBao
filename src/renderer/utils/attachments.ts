export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function validateImageFile(file: File): string | undefined {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    return '仅支持 JPEG、PNG、GIF、WebP 图片';
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return '单张图片不能超过 10MB';
  }
  return undefined;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('读取文件失败'));
        return;
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}
