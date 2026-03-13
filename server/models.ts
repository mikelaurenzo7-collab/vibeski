import OpenAI from "openai";

export interface ModelProvider {
  sendMessage(messages: Array<{ role: string; content: string }>, systemPrompt: string): AsyncIterable<string>;
  name: string;
  modelLabel: string;
}

export class GrokProvider implements ModelProvider {
  name = 'grok';
  modelLabel = 'Grok';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
  }

  async *sendMessage(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: 'grok-3-mini-fast',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 16384,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }
}

export class OpenAIProvider implements ModelProvider {
  name = 'openai';
  modelLabel = 'Raptor';
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async *sendMessage(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_completion_tokens: 16384,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }
}

export function getProviderForAgent(agentId: string): 'grok' | 'raptor' {
  const grokAgents = ['builder', 'writer', 'designer', 'strategist'];
  return grokAgents.includes(agentId) ? 'grok' : 'raptor';
}
