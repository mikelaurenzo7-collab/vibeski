import OpenAI from "openai";
import { createXai } from "@ai-sdk/xai";
import { generateImage } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import https from "https";

export interface ModelProvider {
  sendMessage(messages: Array<{ role: string; content: string }>, systemPrompt: string): AsyncIterable<string>;
  name: string;
}

export class RaptorProvider implements ModelProvider {
  name = 'raptor';
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
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

export class GeminiProvider implements ModelProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async *sendMessage(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string
  ): AsyncIterable<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }
}

export class GrokProvider implements ModelProvider {
  name = 'grok';
  private xaiClient: ReturnType<typeof createXai>;

  constructor(private apiKey: string) {
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
        xai: { image: `data:image/png;base64,${sourceImageBase64}` },
      };
    }

    const { image } = await generateImage(options);
    return image.base64;
  }
}

export interface ModelOrchestrator {
  streamToResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    agentId: string,
    onChunk: (chunk: string) => void,
  ): Promise<void>;
  grok: GrokProvider;
}

export function createOrchestrator(config: {
  raptorApiKey: string;
  raptorBaseURL?: string;
  geminiApiKey: string;
  grokApiKey: string;
}): ModelOrchestrator {
  const raptor = new RaptorProvider(config.raptorApiKey, config.raptorBaseURL);
  const gemini = config.geminiApiKey ? new GeminiProvider(config.geminiApiKey) : null;
  const grok = new GrokProvider(config.grokApiKey);

  const providers: ModelProvider[] = [raptor];
  if (gemini) providers.push(gemini);
  providers.push(grok);

  async function streamToResponse(
    messages: Array<{ role: string; content: string }>,
    systemPrompt: string,
    agentId: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        let hasContent = false;
        for await (const chunk of provider.sendMessage(messages, systemPrompt)) {
          hasContent = true;
          onChunk(chunk);
        }
        if (hasContent) return;
      } catch (err) {
        const isLast = i === providers.length - 1;
        console.error(`[${provider.name}] failed${isLast ? '' : `, trying ${providers[i + 1].name}`}:`, (err as Error).message);
        if (isLast) throw err;
      }
    }
  }

  return { streamToResponse, grok };
}

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
        error = new Error(`Grok API ${res.statusCode}: ${errBody}`);
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
