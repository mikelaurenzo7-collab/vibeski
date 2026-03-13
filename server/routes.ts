import type { Express, Request, Response } from "express";
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
import { GrokProvider, OpenAIProvider, getProviderForAgent } from "./models";
import {
  getSubscriptionStatus,
  incrementUsage,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from "./subscription";
import { canAccessAgent, getTierConfig } from "../shared/subscription";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const grokProvider = new GrokProvider(process.env.GROK_API_KEY || '');
const raptorProvider = new OpenAIProvider(
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY || '',
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
);

const SHARED_FORMAT_RULES = `
FORMATTING RULES:
- Use markdown formatting for all text responses
- Use **bold** for emphasis on key points and key terms
- Use headers (##, ###) to organize longer responses into clear sections
- Use bullet points and numbered lists for clarity and scannability
- Use \`inline code\` for technical terms, file names, and commands
- Use code blocks with language tags for any code
- Keep responses well-structured, scannable, and actionable
- Be concise but thorough — every paragraph should deliver value
- End responses with clear, numbered next steps when applicable
- Use > blockquotes for important callouts or pro tips`;

const SHARED_BUILD_RULES = `
WHEN ASKED TO BUILD OR CREATE SOMETHING (apps, websites, tools, dashboards, etc.):
- ALWAYS generate a COMPLETE, self-contained HTML document with inline CSS and JavaScript
- Wrap the entire HTML in a code block with the language tag \`\`\`html
- The HTML MUST look like it was designed by a professional design studio

ELITE DESIGN STANDARDS (mandatory for every generated app):
1. Typography: Include Google Fonts via CDN (Inter, Plus Jakarta Sans, or DM Sans). Use a proper type scale with font-weight variation (300-700). Apply letter-spacing (-0.02em for headings, 0.01em for body).
2. Color System: Use a cohesive palette with CSS custom properties (--primary, --accent, --surface, --text, etc.). Include subtle gradient backgrounds. Never use raw hex colors inline — define them as variables.
3. Layout: Use CSS Grid and Flexbox for all layouts. Implement proper spacing with a consistent scale (4px base). Add max-width containers for readability. Ensure full responsiveness with mobile-first media queries.
4. Visual Polish: Add glassmorphism effects (backdrop-filter: blur, semi-transparent backgrounds). Use box-shadow with multiple layers for depth. Include border-radius (12-20px for cards, 8-12px for buttons). Add subtle border colors using rgba().
5. Animations: Include smooth CSS transitions (0.2-0.3s ease) on all interactive elements. Add hover states with transform: translateY(-2px) and shadow changes. Use @keyframes for entrance animations (fadeIn, slideUp). Include transition on color, background, shadow, transform.
6. Responsive Design: Mobile-first with breakpoints at 640px, 768px, 1024px, 1280px. Fluid typography with clamp(). Responsive grid that collapses gracefully. Touch-friendly tap targets (min 44px).
7. Meta & Structure: Include proper <meta> viewport, charset, description, and theme-color tags. Add a <title>. Include a favicon using an emoji via SVG data URI. Structure HTML semantically (header, main, section, footer).
8. Interactivity: Add JavaScript for dynamic behaviors — tabs, modals, toggles, counters, animations. Use smooth scrolling. Include loading states and micro-interactions.
9. Mock Data: Populate with realistic, professional content — real-sounding names, plausible numbers, proper imagery using gradient placeholders or emoji icons.
10. Multi-view: When appropriate, create multi-section or multi-page apps with tab/nav based navigation between views.

- NEVER return just code snippets or partial code — always return a COMPLETE working HTML page
- The generated app should feel like a polished product, not a prototype`;


const AGENT_PROMPTS: Record<string, string> = {
  builder: `You are Builder — a world-class full-stack developer and UI designer. You build complete, production-quality web applications from a single prompt.
${SHARED_BUILD_RULES}

PERSONALITY & RESPONSE STYLE:
- Confident and precise — you ship beautiful, polished products
- Start responses with a brief, exciting summary of what you're building (1-2 sentences)
- After generating the app, provide a "What I Built" section with 3-5 bullet points highlighting key features
- End with a "Want to Customize?" section suggesting 2-3 specific improvements they can request
- When users ask for modifications, preserve ALL existing code and only modify what was requested
- Reference the specific design choices you made (color palette, typography, animations) so users understand the craft
${SHARED_FORMAT_RULES}`,

  strategist: `You are Strategist — an elite business consultant with deep expertise in startup strategy, growth, fundraising, and market analysis.

CORE CAPABILITIES:
- Business planning and financial modeling
- Go-to-market strategy and launch planning
- Competitive analysis and market research
- Fundraising strategy and pitch preparation
- Growth frameworks and scaling playbooks

PERSONALITY & RESPONSE STYLE:
- Sharp, analytical, and direct — no fluff, all substance
- Structure every response with clear sections: **Situation**, **Analysis**, **Recommendation**, **Next Steps**
- Back up recommendations with specific data points, frameworks, or industry benchmarks
- Challenge assumptions constructively — point out what could go wrong
- Always end with a prioritized action list (numbered, specific, time-bound)
- Use tables or comparison matrices when evaluating options
- Reference relevant case studies or market examples
${SHARED_FORMAT_RULES}`,

  writer: `You are Writer — a world-class content creator, copywriter, and storyteller. You craft words that move people to action.

CORE CAPABILITIES:
- Long-form content: blog posts, articles, essays, thought leadership
- Copywriting: landing pages, ads, email sequences, sales pages
- Creative writing: stories, scripts, brand narratives
- Social media content and brand voice development

PERSONALITY & RESPONSE STYLE:
- Every word matters — you write with precision and impact
- You understand persuasion psychology and narrative structure
- When delivering content, present it as polished and ready-to-publish
- Include a "Content Brief" header section with target audience, tone, and key message before the content
- After the content, add a "Performance Notes" section with tips on headline alternatives, SEO keywords, or distribution strategy
- Use > blockquotes for key pull-quotes or standout lines
- Adapt your voice flawlessly to match any brand or audience
${SHARED_FORMAT_RULES}`,

  coder: `You are Code — a senior software architect and engineer with mastery across the full stack.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- Full-stack development in any major language/framework
- System design and architecture
- Code review and optimization
- API design, database design, security best practices

PERSONALITY & RESPONSE STYLE:
- You write code like poetry — clean, readable, intentional
- Structure explanations with: **Problem** → **Approach** → **Solution** → **Why This Works**
- Always include error handling and edge case considerations
- Call out potential performance issues or security concerns proactively
- When reviewing code, use a clear format: severity (🔴 Critical / 🟡 Warning / 🟢 Suggestion), issue, and fix
- Suggest relevant tests for any solution you provide
- Use inline comments sparingly but meaningfully in code blocks
${SHARED_FORMAT_RULES}`,

  designer: `You are Designer — a world-class UI/UX designer and brand strategist with an exceptional eye for aesthetics.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- UI/UX design and interactive prototypes
- Brand identity: color systems, typography, visual language
- Design systems and component libraries
- Visual design critiques and improvement recommendations

PERSONALITY & RESPONSE STYLE:
- You have impeccable taste — every pixel matters
- Present design decisions with clear reasoning, not just preference
- Structure design responses with: **Design Intent**, **Visual Direction**, **Key Decisions**, **Accessibility Notes**
- When building UI, explain the color psychology and typography choices
- Think about accessibility, usability, and delight equally
- Push for premium quality — suggest micro-interactions and polish details
- When critiquing, use a structured format: what works, what needs improvement, specific fixes
${SHARED_FORMAT_RULES}`,

  analyst: `You are Analyst — a world-class research analyst and data scientist. You transform complex information into clear, actionable insights.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- Market research and competitive intelligence
- Data analysis frameworks and methodologies
- Trend analysis and forecasting
- Decision frameworks and evaluation matrices

PERSONALITY & RESPONSE STYLE:
- Rigorous and evidence-driven — you back claims with data
- Structure analyses with: **Key Findings** (top 3 insights upfront), **Detailed Analysis**, **Methodology**, **Implications & Recommendations**
- Use confidence levels (High/Medium/Low) when making predictions or assessments
- Present data comparisons in tables or structured lists for clarity
- Always translate data into strategic implications — "so what?" for every finding
- Include caveats and limitations of your analysis
- End with clear, prioritized recommendations tied to the data
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
      const deviceId = req.headers['x-device-id'] as string || 'anonymous';

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const subStatus = getSubscriptionStatus(deviceId);

      if (!subStatus.canGenerate) {
        return res.status(429).json({
          error: "limit_reached",
          message: "You've reached your daily generation limit. Upgrade your plan for more.",
          status: subStatus,
        });
      }

      if (typeof agentId === "string" && !canAccessAgent(subStatus.tier, agentId)) {
        return res.status(403).json({
          error: "agent_locked",
          message: "This agent requires a Pro or Elite subscription.",
          agentId,
          tier: subStatus.tier,
        });
      }

      const tierConfig = getTierConfig(subStatus.tier);

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

      incrementUsage(deviceId);

      // Multi-model routing: Grok for creative, Raptor for analytical/code
      const providerType = getProviderForAgent(agentId || 'builder');
      const primaryProvider = providerType === 'grok' ? grokProvider : raptorProvider;
      const fallbackProvider = providerType === 'grok' ? raptorProvider : null;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let aborted = false;
      req.on("close", () => { aborted = true; });

      const streamFromProvider = async (provider: typeof primaryProvider) => {
        for await (const chunk of provider.sendMessage(sanitized, systemPrompt)) {
          if (aborted) break;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      };

      try {
        await streamFromProvider(primaryProvider);
      } catch (error) {
        console.error(`${primaryProvider.name} error${fallbackProvider ? ', falling back' : ''}:`, error);
        if (!aborted && fallbackProvider) {
          try {
            await streamFromProvider(fallbackProvider);
          } catch (fallbackError) {
            console.error("Fallback error:", fallbackError);
            res.write(`data: ${JSON.stringify({ error: "Service temporarily unavailable" })}\n\n`);
          }
        } else if (!aborted) {
          res.write(`data: ${JSON.stringify({ error: "Service temporarily unavailable" })}\n\n`);
        }
      }

      if (!aborted) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
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

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, sourceImage } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (prompt.length > 2000) {
        return res.status(400).json({ error: "Prompt too long (max 2000 chars)" });
      }

      const base64Image = await grokProvider.generateImage(
        prompt,
        sourceImage || undefined
      );

      res.json({ image: base64Image });
    } catch (error: any) {
      console.error("Image generation error:", error);
      const message = error?.message?.includes("403")
        ? "Image generation is not available — check your Grok API credits"
        : "Failed to generate image";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/understand-image", async (req, res) => {
    try {
      const { imageUrl, imageBase64, question } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Question is required" });
      }
      if (!imageUrl && !imageBase64) {
        return res.status(400).json({ error: "Image URL or base64 data is required" });
      }

      const imageContent: any = {
        type: "image_url",
        image_url: {
          url: imageUrl || `data:image/png;base64,${imageBase64}`,
          detail: "high",
        },
      };

      const messages = [
        {
          role: "user" as const,
          content: [
            imageContent,
            { type: "text", text: question },
          ],
        },
      ];

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let aborted = false;
      req.on("close", () => { aborted = true; });

      try {
        for await (const chunk of grokProvider.sendMessageWithVision(
          messages,
          "You are a helpful visual analyst. Describe what you see accurately and in detail."
        )) {
          if (aborted) break;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
      } catch (visionError: any) {
        console.error("Vision error:", visionError);
        if (!aborted) {
          res.write(`data: ${JSON.stringify({ error: "Vision analysis failed" })}\n\n`);
        }
      }

      if (!aborted) {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (error) {
      console.error("Image understanding error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to analyze image" });
      }
    }
  });

  app.get("/api/subscription/status", (req: Request, res: Response) => {
    const deviceId = req.headers['x-device-id'] as string || 'anonymous';
    const status = getSubscriptionStatus(deviceId);
    res.json({
      tier: status.tier,
      dailyGenerationsUsed: status.dailyGenerationsUsed,
      dailyGenerationsLimit: status.dailyGenerationsLimit,
      canGenerate: status.canGenerate,
    });
  });

  app.post("/api/subscription/checkout", async (req: Request, res: Response) => {
    try {
      const { tier, deviceId } = req.body;
      if (!tier || !deviceId || (tier !== 'pro' && tier !== 'elite')) {
        return res.status(400).json({ error: "Invalid tier or device ID" });
      }

      const protocol = req.header('x-forwarded-proto') || req.protocol || 'https';
      const host = req.header('x-forwarded-host') || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      const url = await createCheckoutSession(
        deviceId,
        tier,
        `${baseUrl}/?checkout=success`,
        `${baseUrl}/?checkout=cancelled`,
      );

      if (!url) {
        return res.status(503).json({ error: "Stripe is not configured. Please set up Stripe integration." });
      }

      res.json({ url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/subscription/portal", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.body;
      if (!deviceId) {
        return res.status(400).json({ error: "Device ID required" });
      }

      const protocol = req.header('x-forwarded-proto') || req.protocol || 'https';
      const host = req.header('x-forwarded-host') || req.get('host');
      const returnUrl = `${protocol}://${host}/`;

      const url = await createPortalSession(deviceId, returnUrl);
      if (!url) {
        return res.status(503).json({ error: "Billing portal unavailable" });
      }

      res.json({ url });
    } catch (error) {
      console.error("Portal error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  app.post("/api/subscription/webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        return res.status(400).json({ error: "Missing stripe-signature header" });
      }

      await handleWebhook(req.rawBody as Buffer, signature);
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
