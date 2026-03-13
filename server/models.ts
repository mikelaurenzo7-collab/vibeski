import OpenAI from "openai";
import { createXai } from "@ai-sdk/xai";
import { generateImage } from "ai";

export interface ModelProvider {
  sendMessage(messages: Array<{ role: string; content: string }>, systemPrompt: string): AsyncIterable<string>;
  name: string;
  modelLabel: string;
}

export class GrokProvider implements ModelProvider {
  name = 'grok';
  modelLabel = 'Grok';
  private client: OpenAI;
  private xaiClient: ReturnType<typeof createXai>;

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    });
    this.xaiClient = createXai({ apiKey });
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

  async *sendMessageWithVision(
    messages: Array<{ role: string; content: string | Array<any> }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: 'grok-2-vision-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages as any,
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

  async generateImage(prompt: string, sourceImageBase64?: string): Promise<string> {
    const options: any = {
      model: this.xaiClient.image("grok-2-image"),
      prompt,
    };

    if (sourceImageBase64) {
      options.providerOptions = {
        xai: {
          image: `data:image/png;base64,${sourceImageBase64}`,
        },
      };
    }

    const { image } = await generateImage(options);
    return image.base64;
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
