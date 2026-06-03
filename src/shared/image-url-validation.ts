/**
 * DashScope 多模态会从云端拉取 image URL，localhost / 内网 / 非 http(s) 会触发 url error。
 * 另：qwen3.7-plus 等模型误用 text-generation 端点也会报同名错误（端点与模型不匹配）。
 * @see https://help.aliyun.com/zh/model-studio/error-code#error-url
 */

export function isRemoteAccessibleImageUrl(url: string | undefined | null): boolean {
  const raw = url?.trim();
  if (!raw) return false;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const host = parsed.hostname.toLowerCase();
  if (!host) return false;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
    return false;
  }
  if (host.endsWith('.local')) return false;

  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;

  return true;
}

export const DASHSCOPE_IMAGE_URL_HINT =
  '图片链接须能被阿里云模型服务从公网访问：请配置对象存储的「对外访问地址」（公网域名/HTTPS），或启用预签名 URL；不能使用 localhost、127.0.0.1 或内网 IP。';

export function assertRemoteAccessibleImageUrl(url: string | undefined | null): void {
  if (isRemoteAccessibleImageUrl(url)) return;
  throw new Error(DASHSCOPE_IMAGE_URL_HINT);
}
