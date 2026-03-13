import OpenAI from "openai";
import { createXai } from "@ai-sdk/xai";
import { generateImage } from "ai";
import https from "https";

async function* streamFromXai(
  apiKey: string,
  model: string,
  messages: Array<any>,
  maxTokens: number,
  temperature: number
): AsyncIterable<string> {
  const queue: string[] = [];
  let done = false;
  let error: Error | null = null;
  let waiting: (() => void) | null = null;

  const body = JSON.stringify({ model, messages, stream: true, max_tokens: maxTokens, temperature });

  const req = https.request('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, (res) => {
    if (res.statusCode !== 200) {
      let errBody = '';
      res.on('data', (d) => errBody += d);
      res.on('end', () => {
        error = new Error(`Grok API error ${res.statusCode}: ${errBody}`);
        done = true;
        if (waiting) waiting();
      });
      return;
    }

    let buffer = '';
    res.setEncoding('utf8');
    res.on('data', (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            queue.push(content);
            if (waiting) waiting();
          }
        } catch {}
      }
    });
    res.on('end', () => { done = true; if (waiting) waiting(); });
    res.on('error', (e) => { error = e as Error; done = true; if (waiting) waiting(); });
  });

  req.on('error', (e) => { error = e as Error; done = true; if (waiting) waiting(); });
  req.write(body);
  req.end();

  while (true) {
    while (queue.length > 0) {
      yield queue.shift()!;
    }
    if (done) break;
    await new Promise<void>((resolve) => { waiting = resolve; });
    waiting = null;
  }

  if (error) throw error;
}

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
    yield* streamFromXai(this.apiKey, 'grok-3-mini-fast', [
      { role: 'system', content: systemPrompt },
      ...messages,
    ], 16384, 0.7);
  }

  async *sendMessageWithVision(
    messages: Array<{ role: string; content: string | Array<any> }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    yield* streamFromXai(this.apiKey, 'grok-2-vision-latest', [
      { role: 'system', content: systemPrompt },
      ...messages,
    ], 16384, 0.7);
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
