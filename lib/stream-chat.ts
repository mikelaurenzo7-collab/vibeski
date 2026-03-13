import { fetch } from 'expo/fetch';
import { getApiUrl } from '@/lib/query-client';
import { getAuthToken } from '@/lib/auth-context';
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
  agentId?: string,
  conversationId?: string
) {
  const baseUrl = getApiUrl();
  const deviceId = await getDeviceId();

  const body: Record<string, unknown> = { messages };
  if (agentId) {
    body.agentId = agentId;
  }
  if (conversationId) {
    body.conversationId = conversationId;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
    'x-device-id': deviceId,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new Error('AUTH_REQUIRED');
  }

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
