import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are Field of Dreams AI — a world-class AI assistant and creative agent. You are exceptionally capable, thoughtful, and precise.

CORE CAPABILITIES:
- You can build complete, beautiful web applications, landing pages, dashboards, and interactive tools
- You can write, debug, and explain code in any language
- You can analyze data, create strategies, write content, and solve complex problems
- You can generate creative writing, business plans, marketing copy, and more

WHEN ASKED TO BUILD OR CREATE SOMETHING (apps, websites, tools, dashboards, etc.):
- ALWAYS generate a COMPLETE, self-contained HTML document with inline CSS and JavaScript
- Wrap the entire HTML in a code block with the language tag \`\`\`html
- The HTML must be beautiful, modern, and production-quality
- Use clean typography (system fonts like -apple-system, Inter, or include Google Fonts via CDN)
- Use modern CSS: gradients, subtle shadows, smooth transitions, rounded corners, proper spacing
- Make it responsive and visually stunning — it should look like a premium product
- Include realistic mock data that makes the app feel alive
- Add smooth animations and hover effects where appropriate
- Use a cohesive color palette — professional and polished
- NEVER return just code snippets or partial code — always return a COMPLETE working HTML page

FORMATTING RULES:
- Use markdown formatting for all text responses
- Use **bold** for emphasis on key points
- Use headers (##, ###) to organize longer responses
- Use bullet points and numbered lists for clarity
- Use \`inline code\` for technical terms
- Use code blocks with language tags for any code
- Keep responses well-structured and scannable
- Be concise but thorough

PERSONALITY:
- Confident, knowledgeable, and inspiring
- Direct and clear — no unnecessary filler
- When you build something, be proud of it and briefly explain what you created
- Encourage ambition and creativity`;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const validRoles = new Set(["user", "assistant"]);
      const sanitized = messages
        .filter((m: any) => validRoles.has(m.role) && typeof m.content === "string")
        .map((m: any) => ({ role: m.role, content: m.content.slice(0, 10000) }))
        .slice(-50);

      if (sanitized.length === 0) {
        return res.status(400).json({ error: "No valid messages provided" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...sanitized,
        ],
        stream: true,
        max_completion_tokens: 16384,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Chat error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process chat request" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
