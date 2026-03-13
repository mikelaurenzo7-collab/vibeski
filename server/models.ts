// Use native fetch (Node 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

export interface ModelResponse {
  content: string;
  model: string;
}

export interface ModelProvider {
  sendMessage(messages: Array<{ role: string; content: string }>, systemPrompt: string): AsyncIterable<string>;
  name: string;
}

// Grok provider (xAI)
export class GrokProvider implements ModelProvider {
  name = 'grok';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *sendMessage(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Grok API error: ${response.status} ${error}`);
    }

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
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) yield content;
        } catch {
          // Skip parse errors
        }
      }
    }
  }
}

// Claude provider (Anthropic)
export class ClaudeProvider implements ModelProvider {
  name = 'claude';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *sendMessage(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 16384,
        system: systemPrompt,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} ${error}`);
    }

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

        try {
          const event = JSON.parse(data);
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            yield event.delta.text;
          }
        } catch {
          // Skip parse errors
        }
      }
    }
  }
}

// Get provider based on agent
export function getProviderForAgent(agentId: string): 'grok' | 'claude' {
  const grokAgents = ['builder', 'writer', 'designer', 'strategist'];
  return grokAgents.includes(agentId) ? 'grok' : 'claude';
}
