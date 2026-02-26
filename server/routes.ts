import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
            content: "You are Field of Dreams AI, a helpful and knowledgeable assistant. You provide clear, concise, and thoughtful responses. You have a warm, encouraging tone that inspires users to achieve their goals. When appropriate, you use metaphors related to growth, cultivation, and building dreams.",
          },
          ...sanitized,
        ],
        stream: true,
        max_completion_tokens: 8192,
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
