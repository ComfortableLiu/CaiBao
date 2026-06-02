import OpenAI from 'openai';

export function createLlmClient(baseURL: string, apiKey: string): OpenAI {
  const normalized = baseURL.replace(/\/$/, '');
  return new OpenAI({
    baseURL: normalized,
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}
