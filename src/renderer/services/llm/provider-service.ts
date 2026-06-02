import { createLlmClient } from './createLlmClient';

export async function syncModels(baseURL: string, apiKey: string): Promise<string[]> {
  const client = createLlmClient(baseURL, apiKey);
  const page = await client.models.list();
  const ids = page.data.map((m) => m.id).filter(Boolean).sort();
  return ids;
}

export function isValidBaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
