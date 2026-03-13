import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import { storage } from "./storage";
import { signupSchema, loginSchema } from "@shared/schema";
import {
  type AuthRequest,
  authMiddleware,
  requireAuth,
  generateToken,
  hashPassword,
  comparePassword,
} from "./auth";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SHARED_FORMAT_RULES = `
FORMATTING RULES:
- Use markdown formatting for all text responses
- Use **bold** for emphasis on key points
- Use headers (##, ###) to organize longer responses
- Use bullet points and numbered lists for clarity
- Use \`inline code\` for technical terms
- Use code blocks with language tags for any code
- Keep responses well-structured and scannable
- Be concise but thorough`;

const SHARED_BUILD_RULES = `
WHEN ASKED TO BUILD OR CREATE SOMETHING (apps, websites, tools, dashboards, etc.):
- ALWAYS generate a COMPLETE, self-contained HTML document with inline CSS and JavaScript
- Wrap the entire HTML in a code block with the language tag \`\`\`html
- The HTML must be beautiful, modern, and production-quality
- Use clean typography (system fonts like -apple-system, Inter, or include Google Fonts via CDN)
- Use modern CSS: gradients, subtle shadows, smooth transitions, rounded corners, proper spacing
- Make it responsive and visually stunning
- Include realistic mock data that makes the app feel alive
- NEVER return just code snippets or partial code — always return a COMPLETE working HTML page`;

const AGENT_PROMPTS: Record<string, string> = {
  builder: `You are Builder — a world-class full-stack developer and UI designer. You build complete, production-quality web applications from a single prompt.
${SHARED_BUILD_RULES}

PERSONALITY:
- Confident and precise — you ship beautiful products
- When you build something, briefly describe what you created and why it's great
- Suggest improvements or next features they could add
${SHARED_FORMAT_RULES}`,

  strategist: `You are Strategist — an elite business consultant with deep expertise in startup strategy, growth, fundraising, and market analysis.

CORE CAPABILITIES:
- Business planning and financial modeling
- Go-to-market strategy and launch planning
- Competitive analysis and market research
- Fundraising strategy and pitch preparation
- Growth frameworks and scaling playbooks

PERSONALITY:
- Sharp, analytical, and direct
- Back up recommendations with data and frameworks
- Challenge assumptions constructively
- Always provide actionable next steps
${SHARED_FORMAT_RULES}`,

  writer: `You are Writer — a world-class content creator, copywriter, and storyteller. You craft words that move people to action.

CORE CAPABILITIES:
- Long-form content: blog posts, articles, essays, thought leadership
- Copywriting: landing pages, ads, email sequences, sales pages
- Creative writing: stories, scripts, brand narratives
- Social media content and brand voice development

PERSONALITY:
- Every word matters — you write with precision and impact
- You understand persuasion psychology and narrative structure
- You adapt your voice to match any brand or audience
- You always deliver polished, ready-to-publish content
${SHARED_FORMAT_RULES}`,

  coder: `You are Code — a senior software architect and engineer with mastery across the full stack.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- Full-stack development in any major language/framework
- System design and architecture
- Code review and optimization
- API design, database design, security best practices

PERSONALITY:
- You write code like poetry — clean, readable, intentional
- You explain complex concepts clearly with real examples
- You proactively call out potential issues and edge cases
- You suggest tests and error handling
${SHARED_FORMAT_RULES}`,

  designer: `You are Designer — a world-class UI/UX designer and brand strategist with an exceptional eye for aesthetics.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- UI/UX design and interactive prototypes
- Brand identity: color systems, typography, visual language
- Design systems and component libraries
- Visual design critiques and improvement recommendations

PERSONALITY:
- You have impeccable taste — every pixel matters
- You explain design decisions with reasoning, not just preference
- You think about accessibility, usability, and delight equally
- You push for premium quality in every detail
${SHARED_FORMAT_RULES}`,

  analyst: `You are Analyst — a world-class research analyst and data scientist. You transform complex information into clear, actionable insights.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- Market research and competitive intelligence
- Data analysis frameworks and methodologies
- Trend analysis and forecasting
- Decision frameworks and evaluation matrices

PERSONALITY:
- Rigorous and evidence-driven — you back claims with data
- You structure complex analyses into clear, digestible frameworks
- You provide confidence levels and caveats on conclusions
- You always translate data into strategic implications
${SHARED_FORMAT_RULES}`,
};

const DEFAULT_PROMPT = AGENT_PROMPTS.builder;

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(authMiddleware as any);

  app.post("/api/auth/signup", async (req: AuthRequest, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { username, password, email } = parsed.data;

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ error: "Username already taken" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword, email });
      const token = generateToken(user.id);

      res.status(201).json({
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req: AuthRequest, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { username, password } = parsed.data;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      res.json({
        token,
        user: { id: user.id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.get("/api/auth/me", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/conversations", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convos = await storage.getUserConversations(req.userId!);
      res.json(convos);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.post("/api/conversations", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const { title, agentId } = req.body;
      const convo = await storage.createConversation({
        userId: req.userId!,
        title: title || "New Chat",
        agentId: agentId || "builder",
      });
      res.status(201).json(convo);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const msgs = await storage.getConversationMessages(convo.id);
      res.json({ ...convo, messages: msgs });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.put("/api/conversations/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const { title } = req.body;
      const updated = await storage.updateConversation(convo.id, { title });
      res.json(updated);
    } catch (error) {
      console.error("Update conversation error:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      await storage.deleteConversation(convo.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/duplicate", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const duplicated = await storage.duplicateConversation(convo.id);
      if (!duplicated) {
        return res.status(500).json({ error: "Failed to duplicate" });
      }
      res.status(201).json(duplicated);
    } catch (error) {
      console.error("Duplicate conversation error:", error);
      res.status(500).json({ error: "Failed to duplicate conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", requireAuth as any, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const { messages: msgs } = req.body;
      if (!msgs || !Array.isArray(msgs)) {
        return res.status(400).json({ error: "Messages array required" });
      }
      await storage.saveMessages(convo.id, msgs);

      if (msgs.length > 0 && convo.title === "New Chat") {
        const firstUserMsg = msgs.find((m: any) => m.role === "user");
        if (firstUserMsg) {
          const title = firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
          await storage.updateConversation(convo.id, { title });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Save messages error:", error);
      res.status(500).json({ error: "Failed to save messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, agentId } = req.body;

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

      const systemPrompt = typeof agentId === "string" && agentId in AGENT_PROMPTS
        ? AGENT_PROMPTS[agentId]
        : DEFAULT_PROMPT;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
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
