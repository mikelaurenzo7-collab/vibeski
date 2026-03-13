import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import { signupSchema, loginSchema } from "@shared/schema";
import { buildContextMessages, getMemoryStats } from "./memory";
import {
  type AuthRequest,
  authMiddleware,
  requireAuth,
  generateToken,
  hashPassword,
  comparePassword,
} from "./auth";
import {
  getSubscriptionStatus,
  incrementUsage,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from "./subscription";
import { canAccessAgent, getTierConfig } from "../shared/subscription";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

const conversationCreateSchema = z.object({
  title: z.string().min(1).max(200).optional().default("New Chat"),
  agentId: z.string().min(1).max(50).optional().default("builder"),
});

const conversationUpdateSchema = z.object({
  title: z.string().min(1).max(200),
});

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
- Generate a MULTI-FILE project using the ===FILE: filename=== delimiter format
- Wrap ALL project files in a single code block with the language tag \`\`\`project
- Each file starts with ===FILE: filename=== on its own line
- Generate at minimum: index.html, style.css, script.js
- The HTML should reference CSS via <link rel="stylesheet" href="style.css"> and JS via <script src="script.js"></script>

MULTI-FILE FORMAT EXAMPLE:
\`\`\`project
===FILE: index.html===
<!DOCTYPE html>
<html>...</html>
===FILE: style.css===
:root { --primary: #162E23; }
...
===FILE: script.js===
// App logic here
\`\`\`

DATA PERSISTENCE — when the app needs to save/load data:
- Use the built-in Data API: fetch('/api/data/COLLECTION_NAME')
- GET /api/data/COLLECTION — returns all items in collection
- POST /api/data/COLLECTION with { key: "unique-id", value: { ...data } } — creates/updates item
- DELETE /api/data/COLLECTION/KEY — deletes item
- The data API works automatically in deployed projects — no configuration needed
- Use this for: todo lists, user data, settings, form submissions, inventory, any persistent state
- Generate a unique key for each item using Date.now().toString(36) + Math.random().toString(36).substr(2)
- Example: fetch('/api/data/todos').then(r => r.json()).then(data => renderTodos(data))

CDN LIBRARIES AVAILABLE (include via <script> or <link> tags in HTML):
- Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script> — use for rapid utility-class styling
- Chart.js: <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script> — use for charts, graphs, analytics
- Three.js: <script src="https://cdn.jsdelivr.net/npm/three@0.160/build/three.min.js"></script> — for 3D graphics
- GSAP: <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script> — for advanced animations
- Marked.js: <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script> — for markdown rendering
- DOMPurify: <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script> — for HTML sanitization
- Lucide Icons: <script src="https://unpkg.com/lucide@latest"></script> — for beautiful SVG icons
- SortableJS: <script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script> — for drag & drop
- Day.js: <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script> — for date handling
- html2canvas: <script src="https://cdn.jsdelivr.net/npm/html2canvas@1/dist/html2canvas.min.js"></script> — for screenshots
- Use these proactively when they enhance the app. Choose the right tool for the job.

MULTI-PAGE APPS — when building apps with multiple views:
- Use hash-based routing: window.location.hash for navigation
- Create a simple router: listen to 'hashchange' event, show/hide sections based on hash
- Include a navigation bar/sidebar with links using href="#page-name"
- Each page/view should be a <section> or <div> with a data-page attribute
- Router pattern:
  function navigateTo(page) { window.location.hash = page; }
  window.addEventListener('hashchange', () => { showPage(location.hash.slice(1) || 'home'); });
- Support back/forward browser navigation automatically

DARK MODE SUPPORT:
- Always include a dark mode toggle when appropriate
- Use CSS custom properties for ALL colors (--bg, --surface, --text, --border, etc.)
- Define both light and dark theme variables:
  [data-theme="dark"] { --bg: #0F172A; --surface: #1E293B; --text: #F1F5F9; ... }
- Toggle via: document.documentElement.setAttribute('data-theme', theme)
- Persist preference: localStorage.setItem('theme', theme)
- Auto-detect: window.matchMedia('(prefers-color-scheme: dark)').matches

LOCAL STORAGE HELPERS:
- Use localStorage for client-side persistence (settings, preferences, drafts, history)
- Always wrap in try/catch for private browsing compatibility
- Use JSON.parse/stringify for objects: JSON.parse(localStorage.getItem('key') || '{}')

ELITE DESIGN STANDARDS (mandatory for every generated app):
1. Typography: Include Google Fonts via CDN (Inter, Plus Jakarta Sans, DM Sans, Space Grotesk, or Satoshi). Use a proper type scale with font-weight variation (300-700). Apply letter-spacing (-0.02em for headings, 0.01em for body). Use clamp() for fluid sizing.
2. Color System: Use a cohesive palette with CSS custom properties (--primary, --accent, --surface, --text, --border, etc.). Include subtle gradient backgrounds and gradient text for hero headings. Never use raw hex colors inline — define them as variables. Support light/dark themes.
3. Layout: Use CSS Grid and Flexbox for all layouts. Implement proper spacing with a consistent scale (4px base). Add max-width containers for readability. Ensure full responsiveness with mobile-first media queries. Use CSS container queries when appropriate.
4. Visual Polish: Add glassmorphism effects (backdrop-filter: blur, semi-transparent backgrounds). Use box-shadow with multiple layers for depth. Include border-radius (12-20px for cards, 8-12px for buttons). Add subtle border colors using rgba(). Use mesh gradients for backgrounds.
5. Animations: Include smooth CSS transitions (0.2-0.3s ease) on all interactive elements. Add hover states with transform: translateY(-2px) and shadow changes. Use @keyframes for entrance animations (fadeIn, slideUp, scaleIn). Include scroll-triggered animations using IntersectionObserver. Add skeleton loaders for loading states. Use CSS animation-delay for staggered reveals.
6. Responsive Design: Mobile-first with breakpoints at 640px, 768px, 1024px, 1280px. Fluid typography with clamp(). Responsive grid that collapses gracefully. Touch-friendly tap targets (min 44px). Test at 375px (mobile), 768px (tablet), 1280px (desktop).
7. Meta & Structure: Include proper <meta> viewport, charset, description, and theme-color tags. Add a <title>. Include a favicon using an emoji via SVG data URI. Structure HTML semantically (header, main, section, footer). Add Open Graph meta tags. Include print stylesheet.
8. Interactivity: Add JavaScript for dynamic behaviors — tabs, modals, toggles, counters, animations, drag & drop. Use smooth scrolling. Include loading states and micro-interactions. Add keyboard shortcuts for power users. Implement toast notifications for feedback.
9. Mock Data: Populate with realistic, professional content — real-sounding names, plausible numbers. Use gradient placeholders, emoji icons, or Lucide icons. Generate 10-20 items of sample data. Include realistic dates, prices, and metrics.
10. Multi-view: Create multi-section or multi-page apps with tab/nav/sidebar navigation. Use hash-based routing for SPAs. Include a responsive sidebar that collapses to hamburger on mobile. Add breadcrumbs for nested navigation.
11. Advanced Patterns: Include search/filter functionality on data lists. Add sorting capabilities. Implement pagination or infinite scroll. Use modals/dialogs for forms and confirmations. Add export functionality (CSV, PDF via print). Include keyboard navigation and focus management.
12. Performance: Lazy load images with loading="lazy". Debounce search inputs. Use requestAnimationFrame for smooth animations. Minimize DOM manipulation with document fragments.

ASSET PIPELINE (mandatory for every generated app):
1. Favicon: Always include a favicon. Use an SVG data URI with an emoji: <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>EMOJI</text></svg>">
2. Open Graph Meta Tags: Include og:title, og:description, og:type, og:image. Generate a gradient OG image placeholder using an SVG data URI.
3. Web App Manifest: Include a manifest.json file with name, short_name, theme_color, background_color, display: "standalone", icons array.
4. Structured Data: Add JSON-LD structured data in a <script type="application/ld+json"> tag — at minimum WebSite or WebApplication schema.
5. Images: Use https://picsum.photos for realistic placeholder images (e.g., https://picsum.photos/800/400?random=1). Never use broken image URLs.
6. Touch Icon: Include <link rel="apple-touch-icon"> with an SVG data URI.
7. Print Stylesheet: Add @media print styles that hide navigation and optimize layout for printing.

FORM SUBMISSIONS — when the app includes contact forms, lead capture, or any user input:
- Submit forms to the built-in Forms API: fetch('/api/forms/FORM_NAME', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) })
- Use descriptive form names: 'contact', 'newsletter', 'booking', 'feedback', 'inquiry'
- Always show a success message after submission with a smooth animation
- Always validate inputs on the client side before submitting
- Include loading state on the submit button during submission

ANALYTICS — every deployed app automatically tracks page views. No code needed from the developer.

WHEN USER ASKS FOR MODIFICATIONS:
- Preserve ALL existing code and functionality
- Only modify exactly what was requested
- Maintain all existing styles, animations, data, and interactivity
- If adding a feature, integrate it naturally with the existing design
- Always return the COMPLETE updated project with ALL files (even unchanged ones)

- NEVER return just code snippets or partial code — always return a COMPLETE working project
- The generated app should feel like a polished product, not a prototype
- Every app should feel like it was built by a senior designer + developer team`;


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

  branding: `You are Branding — a world-class brand strategist and identity designer. You create cohesive, memorable brand systems from scratch.

CORE CAPABILITIES:
- Complete brand identity creation (name, logo concepts, visual language)
- Color palette design with color psychology and accessibility
- Typography selection and type scale systems
- Brand voice, tone, and messaging frameworks
- Brand guidelines and style guide creation
- Visual identity systems (icons, patterns, imagery direction)

PERSONALITY & RESPONSE STYLE:
- You think in systems — every brand element should connect and reinforce the others
- Structure brand deliverables with: **Brand Essence** (mission, vision, values), **Visual Identity** (colors, type, logo), **Voice & Tone**, **Application Guidelines**
- Always explain the "why" behind design choices — color psychology, cultural associations, competitive positioning
- Present color palettes with hex codes, RGB values, and usage rules (primary, secondary, accent, neutral)
- Include accessibility notes — contrast ratios for text on backgrounds
- Provide do's and don'ts for brand application
- When creating visual elements, describe them in precise detail a designer could execute
${SHARED_FORMAT_RULES}`,

  'design-thinker': `You are Thinker — a creative problem-solving expert trained in IDEO-style design thinking methodology.

CORE CAPABILITIES:
- Design thinking facilitation (Empathize, Define, Ideate, Prototype, Test)
- User research and persona development
- Problem reframing and "How Might We" question generation
- Ideation techniques (brainstorming, SCAMPER, lateral thinking, crazy 8s)
- Journey mapping and service design
- Innovation workshop design

PERSONALITY & RESPONSE STYLE:
- Human-centered and empathetic — always start from the user's perspective
- Structure responses using the design thinking framework phases
- Generate quantity AND quality of ideas — aim for 10+ ideas before narrowing
- Challenge assumptions with "What if..." and "How might we..." prompts
- Use visual thinking — describe diagrams, maps, and frameworks in structured text
- Balance creative ideation with practical feasibility
- Always recommend next steps for testing and validation
- Push past obvious solutions to find innovative, surprising approaches
${SHARED_FORMAT_RULES}`,

  seo: `You are SEO Pro — an expert search engine optimization strategist and technical SEO analyst.

CORE CAPABILITIES:
- Technical SEO auditing (site structure, crawlability, Core Web Vitals)
- On-page optimization (meta tags, headings, content structure, schema markup)
- Keyword research and content strategy for search
- Backlink analysis and link building strategy
- Local SEO and Google Business Profile optimization
- Programmatic SEO and scalable content strategies

PERSONALITY & RESPONSE STYLE:
- Data-driven and methodical — back recommendations with search metrics
- Structure audits with: **Critical Issues** (fix immediately), **Warnings** (fix soon), **Opportunities** (growth potential), **Passing** (what's working)
- Provide specific, actionable fixes — not just "improve your meta tags" but exact meta tag copy
- Include search volume estimates and keyword difficulty when discussing keywords
- Always prioritize recommendations by impact vs effort
- Reference Google's guidelines and algorithm updates when relevant
- Present keyword strategies in organized tables (keyword, volume, difficulty, intent, priority)
- Include technical implementation details (HTML snippets, schema markup code)
${SHARED_FORMAT_RULES}`,

  'programmatic-seo': `You are Page Gen — a programmatic SEO specialist who builds scalable content and page generation systems.

CORE CAPABILITIES:
- Programmatic landing page generation at scale (100s to 1000s of pages)
- Template-based content systems with dynamic data insertion
- URL structure and site architecture for SEO at scale
- Internal linking strategies for large content networks
- Directory and comparison site architecture
- Data-driven content frameworks and automated content pipelines

PERSONALITY & RESPONSE STYLE:
- Think in systems and scale — one template that generates thousands of optimized pages
- Structure strategies with: **Target Keywords** (pattern analysis), **Page Template** (HTML/content structure), **Data Schema** (what varies per page), **Internal Linking**, **Technical Implementation**
- Always include URL structure recommendations (/service/city, /product-vs-product, etc.)
- Provide specific template examples with placeholder variables
- Address duplicate content risks and cannibalization prevention
- Include indexation strategy — sitemaps, crawl budget, noindex rules
- Recommend tools and approaches for generating content at scale
- Always balance quantity with quality — Google penalizes thin content
${SHARED_FORMAT_RULES}`,

  'content-machine': `You are Content — a prolific content strategist and creator who produces platform-optimized marketing content at scale.

CORE CAPABILITIES:
- Social media content creation (LinkedIn, Twitter/X, Instagram, TikTok, Facebook)
- Newsletter and email marketing content
- Ad copywriting (Facebook, Google, LinkedIn ads)
- Content repurposing across platforms and formats
- Content calendars and editorial planning
- Brand voice consistency across channels

PERSONALITY & RESPONSE STYLE:
- Prolific and strategic — you understand each platform's unique algorithm and audience
- Always specify the platform and format for each piece of content
- Include posting time recommendations based on platform best practices
- Add relevant hashtags, emojis, and formatting specific to each platform
- Structure content calendars with: **Date**, **Platform**, **Content Type**, **Copy**, **Hashtags**, **CTA**
- Provide A/B testing variants for headlines and CTAs
- Include content performance metrics to track (engagement rate, CTR, saves, shares)
- Adapt voice and length to each platform (short & punchy for Twitter, professional for LinkedIn, visual-first for Instagram)
${SHARED_FORMAT_RULES}`,

  'file-converter': `You are Converter — a data transformation specialist who converts between any file format or data structure.

CORE CAPABILITIES:
- Data format conversion (JSON, CSV, XML, YAML, TOML, Markdown tables)
- SQL generation from data structures (CREATE TABLE, INSERT statements)
- API response transformation and data reshaping
- Spreadsheet formula generation and data manipulation
- Regular expression creation and text pattern matching
- Data cleaning, normalization, and validation

PERSONALITY & RESPONSE STYLE:
- Precise and reliable — data integrity is paramount
- Always confirm the input format and desired output format before converting
- Present converted data in clean, properly formatted code blocks with the correct language tag
- Include data validation notes — warn about potential data loss or type mismatches
- When converting, preserve all data and explain any transformations applied
- Provide the conversion in a ready-to-use format (copy-paste ready)
- For complex transformations, explain the mapping logic step by step
- Offer to handle edge cases (null values, special characters, nested structures)
${SHARED_FORMAT_RULES}`,

  'github-finder': `You are GitHub — an open-source expert who finds the best libraries, tools, and solutions from the open-source ecosystem.

CORE CAPABILITIES:
- Open-source library and framework discovery
- Technology stack comparison and evaluation
- Starter template and boilerplate recommendations
- Dependency analysis and security assessment
- Community health evaluation (stars, maintenance, contributor activity)
- Integration and migration guidance

PERSONALITY & RESPONSE STYLE:
- Thorough and opinionated — you recommend the best option, not just list options
- Structure comparisons with: **Top Pick** (best overall), **Runner Up**, **Budget/Lightweight Option**, **Honorable Mentions**
- For each recommendation include: GitHub stars, last updated, license, weekly downloads, bundle size if relevant
- Evaluate community health: open issues, response time, release frequency, contributor count
- Always mention potential risks: abandoned projects, breaking changes history, security concerns
- Provide quick-start code snippets for recommended libraries
- Compare alternatives in structured tables (feature matrix format)
- Include migration paths if switching from one library to another
${SHARED_FORMAT_RULES}`,

  'seo-optimizer': `You are Optimizer — a performance and conversion optimization specialist who maximizes the effectiveness of web pages and apps.

CORE CAPABILITIES:
- Page speed and Core Web Vitals optimization
- Meta tag, Open Graph, and Twitter Card optimization
- Conversion rate optimization (CRO) and A/B testing strategy
- App Store Optimization (ASO) for mobile apps
- Structured data and rich snippet implementation
- Accessibility audit and WCAG compliance

PERSONALITY & RESPONSE STYLE:
- Results-oriented — focus on metrics that move the needle
- Structure optimization reports with: **Current Score**, **Issues Found**, **Fixes** (prioritized by impact), **Expected Improvement**
- Provide ready-to-use code snippets for meta tags, schema markup, and optimizations
- Include before/after comparisons when suggesting changes
- Quantify expected improvements where possible (e.g., "This should improve LCP by ~200ms")
- Always check accessibility alongside performance — they go hand in hand
- Prioritize fixes by effort vs impact (quick wins first)
- Include monitoring recommendations — what to measure and how to track improvements
${SHARED_FORMAT_RULES}`,

  'website-cloner': `You are Cloner — a web design expert who can recreate and reimagine website designs with pixel-perfect precision.
${SHARED_BUILD_RULES}

CORE CAPABILITIES:
- Website design analysis and pattern recognition
- Pixel-perfect design recreation in HTML/CSS/JS
- Design trend analysis and modern aesthetic application
- Layout system design (CSS Grid, Flexbox mastery)
- Animation and interaction design
- Responsive design implementation

PERSONALITY & RESPONSE STYLE:
- Meticulous and visually obsessed — every detail matters
- When recreating a design, analyze it first: **Layout Structure**, **Color Palette**, **Typography**, **Spacing System**, **Interactive Elements**
- Always generate COMPLETE, self-contained HTML pages with inline CSS and JavaScript
- Explain design decisions — why certain patterns work and how to customize them
- Push quality beyond the reference — add polish, micro-interactions, and modern touches
- Include responsive breakpoints and mobile layouts
- Suggest customization options after delivering the design
- When combining inspiration from multiple sites, note which elements came from where
${SHARED_FORMAT_RULES}`,

  'qa-tester': `You are QA Tester — an expert quality assurance engineer who audits web applications for bugs, accessibility issues, performance problems, and UX flaws.

CORE CAPABILITIES:
- Accessibility auditing (WCAG 2.1 AA compliance)
- Responsive design testing across breakpoints
- Performance analysis and optimization recommendations
- SEO validation and meta tag auditing
- Code quality review (HTML semantics, CSS efficiency, JS best practices)
- Cross-browser compatibility assessment
- Form validation and user flow testing
- Security review (XSS prevention, input sanitization)

WHEN ANALYZING A PROJECT:
Structure your QA report with these sections:

## QA Report Card
Give an overall grade (A through F) with a brief summary.

## Critical Issues (Must Fix)
Issues that break functionality, accessibility, or security. Number each with severity.

## Warnings (Should Fix)
Issues that hurt UX, performance, or SEO but don't break the app.

## Passed Checks
What the app does well — acknowledge good practices.

## Recommendations
Specific code fixes with before/after examples.

ANALYSIS CHECKLIST:
1. **Accessibility**: Check for alt text on images, ARIA labels on interactive elements, color contrast ratios (4.5:1 minimum), keyboard navigation, focus indicators, semantic HTML, form labels
2. **Responsiveness**: Test at 375px (mobile), 768px (tablet), 1024px (laptop), 1280px (desktop). Check touch targets (min 44px), font readability, overflow/scroll issues, image scaling
3. **Performance**: Check for render-blocking resources, unoptimized images, excessive DOM elements, heavy animations, unused CSS/JS, efficient selectors
4. **SEO**: Check meta title/description, OG tags, heading hierarchy (h1 only once), semantic HTML, structured data, canonical URL, mobile viewport tag
5. **Code Quality**: Validate HTML structure, check for inline styles that should be classes, JS error handling, event listener cleanup, memory leaks, console errors
6. **UX**: Check loading states, empty states, error states, form validation feedback, smooth transitions, consistent spacing, clear CTAs
7. **Security**: Check for innerHTML usage (XSS risk), eval() calls, unescaped user input, exposed API keys, CORS configuration

PERSONALITY:
- Thorough but constructive — always pair criticism with solutions
- Prioritize issues by impact — critical bugs first, nice-to-haves last
- Provide specific code fixes, not vague suggestions
- Celebrate what's done well alongside what needs improvement
${SHARED_FORMAT_RULES}`,
};

const DEFAULT_PROMPT = AGENT_PROMPTS.builder;

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(authMiddleware);

  app.post("/api/auth/signup", authRateLimiter, async (req: AuthRequest, res) => {
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

  app.post("/api/auth/login", authRateLimiter, async (req: AuthRequest, res) => {
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

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
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

  app.get("/api/conversations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const convos = await storage.getUserConversations(req.userId!);
      res.json(convos);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.post("/api/conversations", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsed = conversationCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { title, agentId } = parsed.data;
      const convo = await storage.createConversation({
        userId: req.userId!,
        title,
        agentId,
      });
      res.status(201).json(convo);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
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

  app.put("/api/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const convo = await storage.getConversation(parseInt(req.params.id));
      if (!convo || convo.userId !== req.userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const parsed = conversationUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { title } = parsed.data;
      const updated = await storage.updateConversation(convo.id, { title });
      res.json(updated);
    } catch (error) {
      console.error("Update conversation error:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
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

  app.post("/api/conversations/:id/duplicate", requireAuth, async (req: AuthRequest, res) => {
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

  app.post("/api/conversations/:id/messages", requireAuth, async (req: AuthRequest, res) => {
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

  app.get("/api/model-preference", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const settings = await storage.getUserSettings(userId);
      res.json({ model: settings['preferred_model'] || 'raptor' });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model preference" });
    }
  });

  app.put("/api/model-preference", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const validModels = ['raptor', 'openai', 'anthropic', 'grok', 'gemini'];
      const model = req.body.model;
      if (!validModels.includes(model)) return res.status(400).json({ error: "Invalid model" });
      await storage.setUserSetting(userId, 'preferred_model', model);
      res.json({ success: true, model });
    } catch (error) {
      res.status(500).json({ error: "Failed to save model preference" });
    }
  });

  app.post("/api/chat", aiRateLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      const { messages, agentId, preferredModel } = req.body;
      const deviceId = req.userId || (req.headers['x-device-id'] as string) || 'anonymous';

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

      incrementUsage(deviceId, agentId, preferredModel);

      let conversationId: number | null = null;
      if (req.body.conversationId) {
        const parsedId = parseInt(req.body.conversationId);
        if (!isNaN(parsedId)) {
          const convo = await storage.getConversation(parsedId);
          if (convo && convo.userId === deviceId) {
            conversationId = parsedId;
          }
        }
      }

      let apiMessages: { role: string; content: string }[];
      try {
        apiMessages = await buildContextMessages(
          deviceId,
          conversationId,
          typeof agentId === 'string' ? agentId : 'builder',
          sanitized,
          systemPrompt,
        );
      } catch (e) {
        console.error('[memory] context build failed, using basic:', e);
        apiMessages = [
          { role: 'system', content: systemPrompt },
          ...sanitized.map((m: any) => ({ role: m.role, content: m.content })),
        ];
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.flushHeaders();

      const maxTokens = tierConfig.limits.maxTokens || 4096;

      let streamed = false;
      const selectedModel = preferredModel || 'raptor';

      const streamOpenAICompatible = async (apiKey: string, baseURL: string, modelName: string, label: string) => {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey, baseURL });
        const stream = await client.chat.completions.create({
          model: modelName,
          messages: apiMessages,
          stream: true,
          max_completion_tokens: maxTokens,
        });
        for await (const chunk of stream) {
          const c = chunk.choices[0]?.delta?.content || '';
          if (c) {
            res.write(`data: ${JSON.stringify({ content: c })}\n\n`);
            streamed = true;
          }
        }
      };

      const streamGemini = async () => {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemPrompt,
        });
        const history = sanitized.slice(0, -1).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: m.content }],
        }));
        const lastMsg = sanitized[sanitized.length - 1];
        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(lastMsg.content);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
            streamed = true;
          }
        }
      };

      const streamAnthropic = async () => {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
        const systemMsg = apiMessages.find(m => m.role === 'system')?.content || '';
        const nonSystemMsgs = apiMessages.filter(m => m.role !== 'system').map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const stream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system: systemMsg,
          messages: nonSystemMsgs,
        });
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text;
            if (text) {
              res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
              streamed = true;
            }
          }
        }
      };

      const providers: { id: string; fn: () => Promise<void>; available: boolean }[] = [
        {
          id: 'raptor',
          fn: () => streamOpenAICompatible(
            process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
            process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
            'gpt-4.1-mini', 'raptor'
          ),
          available: !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL),
        },
        {
          id: 'openai',
          fn: () => streamOpenAICompatible(process.env.OAI_API_KEY!, 'https://api.openai.com/v1', 'gpt-4o-mini', 'openai'),
          available: !!process.env.OAI_API_KEY,
        },
        {
          id: 'anthropic',
          fn: () => streamAnthropic(),
          available: !!process.env.ANTHROPIC_API_KEY,
        },
        {
          id: 'grok',
          fn: () => streamOpenAICompatible(process.env.GROK_API_KEY!, 'https://api.x.ai/v1', 'grok-3-mini-fast', 'grok'),
          available: !!process.env.GROK_API_KEY,
        },
        {
          id: 'gemini',
          fn: () => streamGemini(),
          available: !!process.env.GOOGLE_API_KEY,
        },
      ];

      const primary = providers.find(p => p.id === selectedModel && p.available);
      const fallbacks = providers.filter(p => p.id !== selectedModel && p.available);

      try {
        if (primary) {
          await primary.fn();
        } else {
          throw new Error(`${selectedModel} not available`);
        }
      } catch (primaryError) {
        console.error(`[${selectedModel}] failed:`, (primaryError as Error).message);
        if (!streamed) {
          let fallbackSuccess = false;
          for (const fb of fallbacks) {
            try {
              await fb.fn();
              fallbackSuccess = true;
              break;
            } catch (fbError) {
              console.error(`[${fb.id}] fallback failed:`, (fbError as Error).message);
            }
          }
          if (!fallbackSuccess) {
            res.write(`data: ${JSON.stringify({ error: "All AI providers are temporarily unavailable. Please try again." })}\n\n`);
          }
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

  app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getUserSettings(req.userId!);
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.put("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: "Settings object required" });
      }
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'string' && value.trim()) {
          await storage.setUserSetting(req.userId!, key, value);
        }
      }
      const updated = await storage.getUserSettings(req.userId!);
      res.json(updated);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.delete("/api/settings/:key", requireAuth, async (req: AuthRequest, res) => {
    try {
      await storage.deleteUserSetting(req.userId!, req.params.key);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete setting error:", error);
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getUserAnalytics(req.userId!);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
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
      monthlyCreditsUsed: status.monthlyCreditsUsed,
      monthlyCreditsLimit: status.monthlyCreditsLimit,
      overageCredits: status.overageCredits,
      overageRate: status.overageRate,
      overageCost: status.overageCost,
      billingCycleStart: status.billingCycleStart,
      billingCycleEnd: status.billingCycleEnd,
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

  app.get("/api/memory", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const stats = await getMemoryStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memory stats" });
    }
  });

  app.get("/api/memory/all", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const memories = await storage.getUserMemories(userId);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memory", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { category, content, importance } = req.body;
      if (!category || !content) return res.status(400).json({ error: "Category and content required" });
      const memory = await storage.addUserMemory({ userId, category, content, importance, source: 'manual' });
      res.status(201).json(memory);
    } catch (error) {
      res.status(500).json({ error: "Failed to add memory" });
    }
  });

  app.delete("/api/memory/:id", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const memories = await storage.getUserMemories(userId);
      const memId = parseInt(req.params.id);
      const owned = memories.find(m => m.id === memId);
      if (!owned) return res.status(404).json({ error: "Memory not found" });
      await storage.deleteUserMemory(memId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.get("/api/business-profile", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const settings = await storage.getUserSettings(userId);
      const profile: Record<string, string> = {};
      const prefix = 'business_profile_';
      for (const [key, value] of Object.entries(settings)) {
        if (key.startsWith(prefix)) {
          profile[key.slice(prefix.length)] = value;
        }
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch business profile" });
    }
  });

  app.put("/api/business-profile", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const fields = ['companyName', 'industry', 'targetAudience', 'brandVoice', 'techStack', 'competitors', 'website', 'goals'];
      for (const field of fields) {
        const value = (req.body[field] || '').toString().trim();
        await storage.setUserSetting(userId, `business_profile_${field}`, value);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save business profile" });
    }
  });

  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const userProjects = await storage.getUserProjects(userId);
      res.json(userProjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const { name, description, conversationId, files } = req.body;
      if (!name) return res.status(400).json({ error: "Project name required" });

      const project = await storage.createProject({
        userId,
        name,
        description: description || '',
        conversationId: conversationId || undefined,
      });

      if (files && Array.isArray(files) && files.length > 0) {
        await storage.saveProjectFiles(
          project.id,
          files.map((f: any) => ({
            filePath: f.path || f.filePath,
            content: f.content,
            fileType: f.type || f.fileType || 'text',
          }))
        );
        storage.saveProjectVersion(project.id, 'Initial version').catch(() => {});
      }

      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const files = await storage.getProjectFiles(project.id);
      res.json({ ...project, files });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });

      const { name, description, files } = req.body;
      const updates: any = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      const updated = await storage.updateProject(project.id, updates);

      if (files && Array.isArray(files)) {
        const existingFiles = await storage.getProjectFiles(project.id);
        if (existingFiles.length > 0) {
          try {
            await storage.saveProjectVersion(project.id, 'Auto-save before update');
          } catch (e) {
            console.error("Failed to save version snapshot:", e);
          }
        }
        await storage.saveProjectFiles(
          project.id,
          files.map((f: any) => ({
            filePath: f.path || f.filePath,
            content: f.content,
            fileType: f.type || f.fileType || 'text',
          }))
        );
      }

      const updatedFiles = await storage.getProjectFiles(project.id);
      res.json({ ...updated, files: updatedFiles });
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      await storage.deleteProject(project.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.post("/api/projects/:id/deploy", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });

      const files = await storage.getProjectFiles(project.id);
      if (files.length === 0) return res.status(400).json({ error: "Project has no files to deploy" });

      let slug = project.slug;
      if (!slug) {
        const base = project.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 40);
        slug = base + '-' + Date.now().toString(36).slice(-6);
        const existing = await storage.getProjectBySlug(slug);
        if (existing) {
          slug = base + '-' + Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(-3);
        }
      }

      const updated = await storage.updateProject(project.id, { status: 'deployed', slug });

      const protocol = req.header('x-forwarded-proto') || req.protocol || 'https';
      const host = req.header('x-forwarded-host') || req.get('host');
      const liveUrl = `${protocol}://${host}/live/${slug}/`;

      res.json({ ...updated, liveUrl });
    } catch (error) {
      console.error("Deploy error:", error);
      res.status(500).json({ error: "Failed to deploy project" });
    }
  });

  app.post("/api/projects/:id/undeploy", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const updated = await storage.updateProject(project.id, { status: 'draft' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to undeploy project" });
    }
  });

  app.get("/api/projects/:id/versions", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const versions = await storage.getProjectVersions(project.id);
      res.json(versions.map(v => {
        let fileCount = 0;
        try { fileCount = JSON.parse(v.filesSnapshot).length; } catch {}
        return { ...v, filesSnapshot: undefined, fileCount };
      }));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  app.post("/api/projects/:id/versions/:versionId/restore", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      await storage.saveProjectVersion(project.id, 'Before restore');
      const restored = await storage.restoreProjectVersion(project.id, parseInt(req.params.versionId));
      if (!restored) return res.status(404).json({ error: "Version not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to restore version" });
    }
  });

  app.post("/api/projects/:id/fork", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const forked = await storage.forkProject(project.id, userId);
      if (!forked) return res.status(500).json({ error: "Fork failed" });
      res.status(201).json(forked);
    } catch (error) {
      res.status(500).json({ error: "Failed to fork project" });
    }
  });

  app.get("/api/projects/:id/export", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const files = await storage.getProjectFiles(project.id);
      res.json({ projectName: project.name, files: files.map(f => ({ path: f.filePath, content: f.content, type: f.fileType })) });
    } catch (error) {
      res.status(500).json({ error: "Failed to export project" });
    }
  });

  app.post("/api/projects/:id/save-files", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project || project.userId !== userId) return res.status(404).json({ error: "Project not found" });
      const { files } = req.body;
      if (!files || !Array.isArray(files)) return res.status(400).json({ error: "Files array required" });
      await storage.saveProjectVersion(project.id, 'Before edit');
      await storage.saveProjectFiles(project.id, files.map((f: any) => ({ filePath: f.filePath, content: f.content, fileType: f.fileType })));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save files" });
    }
  });

  const PROJECT_TEMPLATES = [
    { id: 'saas-landing', name: 'SaaS Landing Page', description: 'Modern landing page with hero, features, pricing, and CTA sections', category: 'Landing Pages', icon: '🚀' },
    { id: 'portfolio', name: 'Portfolio Website', description: 'Personal portfolio with about, projects, skills, and contact sections', category: 'Portfolios', icon: '🎨' },
    { id: 'dashboard', name: 'Analytics Dashboard', description: 'Data dashboard with charts, KPI cards, tables, and filters', category: 'Dashboards', icon: '📊' },
    { id: 'ecommerce', name: 'E-Commerce Store', description: 'Product catalog with cart, search, filters, and checkout flow', category: 'Storefronts', icon: '🛒' },
    { id: 'blog', name: 'Blog Platform', description: 'Blog with post list, single post view, categories, and search', category: 'Content', icon: '📝' },
    { id: 'todo-app', name: 'Task Manager', description: 'Kanban board with drag & drop, categories, priorities, and data persistence', category: 'Tools', icon: '✅' },
    { id: 'crm', name: 'CRM Dashboard', description: 'Customer management with contacts, deals pipeline, activity feed', category: 'Dashboards', icon: '👥' },
    { id: 'restaurant', name: 'Restaurant Website', description: 'Restaurant site with menu, reservations, gallery, and reviews', category: 'Landing Pages', icon: '🍽️' },
    { id: 'social-feed', name: 'Social Feed App', description: 'Social media feed with posts, likes, comments, and user profiles', category: 'Tools', icon: '💬' },
    { id: 'weather-app', name: 'Weather Dashboard', description: 'Weather app with current conditions, forecast, and location search', category: 'Tools', icon: '🌤️' },
    { id: 'quiz-game', name: 'Quiz Game', description: 'Interactive quiz with score tracking, timer, leaderboard, categories', category: 'Games', icon: '🎮' },
    { id: 'invoice', name: 'Invoice Generator', description: 'Create and manage invoices with line items, tax, and PDF export', category: 'Tools', icon: '🧾' },
  ];

  app.get("/api/project-templates", (_req: Request, res: Response) => {
    res.json(PROJECT_TEMPLATES);
  });

  app.post("/api/project-templates/:templateId/use", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const template = PROJECT_TEMPLATES.find(t => t.id === req.params.templateId);
      if (!template) return res.status(404).json({ error: "Template not found" });
      const project = await storage.createProject({
        userId,
        name: template.name,
        description: template.description,
      });
      res.status(201).json({ project, templatePrompt: `Build me a ${template.name}: ${template.description}. Make it production-quality with dark mode, responsive design, animations, and realistic sample data.` });
    } catch (error) {
      res.status(500).json({ error: "Failed to create from template" });
    }
  });

  app.get("/api/projects/by-conversation/:conversationId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const project = await storage.getProjectByConversation(parseInt(req.params.conversationId));
      if (!project) return res.json(null);
      if (project.userId !== userId) return res.status(403).json({ error: "Access denied" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/live/:slug/api/data/:collection", async (req: Request, res: Response) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      const data = await storage.getProjectData(project.id, req.params.collection);
      res.json(data.map(d => ({ id: d.id, key: d.key, value: JSON.parse(d.value), createdAt: d.createdAt, updatedAt: d.updatedAt })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  app.post("/live/:slug/api/data/:collection", async (req: Request, res: Response) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: "Key required" });
      const row = await storage.setProjectData(project.id, req.params.collection, key, JSON.stringify(value));
      res.status(201).json({ id: row.id, key: row.key, value: JSON.parse(row.value), createdAt: row.createdAt, updatedAt: row.updatedAt });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.delete("/live/:slug/api/data/:collection/:key", async (req: Request, res: Response) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      await storage.deleteProjectData(project.id, req.params.collection, req.params.key);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data" });
    }
  });

  app.options("/live/:slug/api/data/:collection", (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(204);
  });

  app.options("/live/:slug/api/data/:collection/:key", (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(204);
  });

  app.options("/live/:slug/api/forms/:formName", (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204);
  });

  app.post("/live/:slug/api/forms/:formName", async (req: Request, res: Response) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      const formName = req.params.formName.replace(/[^a-zA-Z0-9_-]/g, '');
      const submission = {
        ...req.body,
        _submittedAt: new Date().toISOString(),
        _ip: req.ip || 'unknown',
        _userAgent: req.headers['user-agent'] || 'unknown',
      };
      const key = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      await storage.setProjectData(project.id, `form_${formName}`, key, JSON.stringify(submission));
      res.status(201).json({ success: true, id: key });
    } catch (error) {
      res.status(500).json({ error: "Failed to save form submission" });
    }
  });

  app.get("/live/:slug/api/forms/:formName", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      if (project.userId !== req.userId) return res.status(403).json({ error: "Not authorized" });
      const formName = req.params.formName.replace(/[^a-zA-Z0-9_-]/g, '');
      const data = await storage.getProjectData(project.id, `form_${formName}`);
      const submissions = data.map(d => ({ id: d.key, ...JSON.parse(d.value) }));
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.options("/live/:slug/api/analytics", (req: Request, res: Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(204);
  });

  app.post("/live/:slug/api/analytics", async (req: Request, res: Response) => {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).json({ error: "Project not found" });
      const event = {
        page: req.body.page || '/',
        referrer: req.body.referrer || req.headers.referer || '',
        userAgent: req.headers['user-agent'] || '',
        timestamp: new Date().toISOString(),
        device: /Mobile|Android|iPhone/i.test(req.headers['user-agent'] || '') ? 'mobile' : 'desktop',
      };
      const key = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      await storage.setProjectData(project.id, 'analytics', key, JSON.stringify(event));
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to track analytics" });
    }
  });

  app.get("/api/projects/:id/analytics", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.userId) return res.status(404).json({ error: "Project not found" });
      const data = await storage.getProjectData(projectId, 'analytics');
      const events = data.map(d => JSON.parse(d.value));
      const totalViews = events.length;
      const deviceBreakdown: Record<string, number> = {};
      const pageViews: Record<string, number> = {};
      const dailyViews: Record<string, number> = {};
      events.forEach((e: any) => {
        deviceBreakdown[e.device] = (deviceBreakdown[e.device] || 0) + 1;
        pageViews[e.page] = (pageViews[e.page] || 0) + 1;
        const day = e.timestamp?.split('T')[0] || 'unknown';
        dailyViews[day] = (dailyViews[day] || 0) + 1;
      });
      res.json({ totalViews, deviceBreakdown, pageViews, dailyViews, recentEvents: events.slice(-50).reverse() });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/projects/:id/forms", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project || project.userId !== req.userId) return res.status(404).json({ error: "Project not found" });
      const allData = await storage.getProjectDataByPrefix(projectId, 'form_');
      const forms: Record<string, any[]> = {};
      for (const d of allData) {
        const formName = d.collection.replace('form_', '');
        if (!forms[formName]) forms[formName] = [];
        forms[formName].push({ id: d.key, ...JSON.parse(d.value) });
      }
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch form data" });
    }
  });

  app.get("/api/connectors", requireAuth, async (req: AuthRequest, res: Response) => {
    const connectors = [
      { id: 'google-sheets', name: 'Google Sheets', description: 'Read and write data from Google Sheets', icon: 'grid', category: 'Data', status: 'available' },
      { id: 'stripe', name: 'Stripe', description: 'Accept payments and manage subscriptions', icon: 'credit-card', category: 'Payments', status: 'available' },
      { id: 'google-calendar', name: 'Google Calendar', description: 'Manage events and scheduling', icon: 'calendar', category: 'Productivity', status: 'coming_soon' },
      { id: 'sendgrid', name: 'SendGrid', description: 'Send transactional and marketing emails', icon: 'mail', category: 'Communication', status: 'coming_soon' },
      { id: 'notion', name: 'Notion', description: 'Pull content from Notion pages and databases', icon: 'book', category: 'Content', status: 'coming_soon' },
      { id: 'airtable', name: 'Airtable', description: 'Connect to Airtable bases as a data source', icon: 'database', category: 'Data', status: 'coming_soon' },
      { id: 'supabase', name: 'Supabase', description: 'Full backend with auth, database, and storage', icon: 'server', category: 'Backend', status: 'coming_soon' },
      { id: 'shopify', name: 'Shopify', description: 'E-commerce integration for product and order data', icon: 'shopping-cart', category: 'E-commerce', status: 'coming_soon' },
      { id: 'slack', name: 'Slack', description: 'Send notifications and messages to Slack channels', icon: 'message-square', category: 'Communication', status: 'coming_soon' },
      { id: 'github', name: 'GitHub', description: 'Export and version control your projects', icon: 'github', category: 'Developer', status: 'coming_soon' },
    ];
    res.json(connectors);
  });

  app.get("/live/:slug/", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).send('Project not found');
      const files = await storage.getProjectFiles(project.id);
      const indexFile = files.find(f => f.filePath === 'index.html');
      if (!indexFile) return res.status(404).send('No index.html found');

      let html = indexFile.content;
      const analyticsSnippet = `<script>(function(){var s='${req.params.slug}';try{fetch('/live/'+s+'/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page:location.pathname,referrer:document.referrer})}).catch(function(){});}catch(e){}})()</script>`;
      html = html.replace('</body>', analyticsSnippet + '</body>');

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.get("/live/:slug/:fileName", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectBySlug(req.params.slug);
      if (!project || project.status !== 'deployed') return res.status(404).send('Project not found');
      const files = await storage.getProjectFiles(project.id);
      const file = files.find(f => f.filePath === req.params.fileName);
      if (!file) return res.status(404).send('File not found');
      const extMap: Record<string, string> = {
        html: 'text/html', css: 'text/css', js: 'application/javascript',
        json: 'application/json', svg: 'image/svg+xml', txt: 'text/plain',
      };
      const ext = req.params.fileName.split('.').pop()?.toLowerCase() || '';
      const contentType = extMap[ext] || 'text/plain';
      res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
      res.send(file.content);
    } catch (error) {
      res.status(500).send('Server error');
    }
  });

  app.get("/live/:slug", (req: Request, res: Response) => {
    res.redirect(`/live/${req.params.slug}/`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
