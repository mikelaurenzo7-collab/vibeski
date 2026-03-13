import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@field_of_dreams_device_id';

async function getDeviceId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    return id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

export async function streamChat(
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  agentId?: string
) {
  const baseUrl = getApiUrl();
  const deviceId = await getDeviceId();

  const body: Record<string, unknown> = { messages };
  if (agentId) {
    body.agentId = agentId;
  }

  const response = await fetch(`${baseUrl}api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'x-device-id': deviceId,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const data = await response.json();
    throw new Error('LIMIT_REACHED');
  }

  if (response.status === 403) {
    const data = await response.json();
    throw new Error('AGENT_LOCKED');
  }

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
