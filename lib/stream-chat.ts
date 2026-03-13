import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';

export async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  agentId?: string
) {
  const baseUrl = getApiUrl();

  const body: Record<string, unknown> = { messages };
  if (agentId) {
    body.agentId = agentId;
  }

  const response = await fetch(`${baseUrl}api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Failed to get response');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) onChunk(parsed.content);
      } catch (e) {
        if (e instanceof Error && e.message !== 'An error occurred') continue;
        throw e;
      }
    }
  }
}
