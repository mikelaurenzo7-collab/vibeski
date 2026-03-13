# FIELD OF DREAMS

## Overview
FIELD OF DREAMS is a premium AI agent platform delivered as a mobile application built with Expo React Native. It offers 15 specialized AI agents powered by a multi-model AI architecture (Raptor primary, Gemini fallback). The platform provides real-time streaming responses with rich markdown rendering and live HTML previews for generated applications and websites. The project aims to provide a comprehensive suite of AI tools for diverse tasks, from business strategy and content creation to coding and design, catering to a wide user base through a flexible subscription and credit system.

## User Preferences
I prefer detailed explanations.
I want iterative development.
I want to be asked before major changes are made.
I like clean, readable code with comprehensive comments.
I prefer a component-based architecture for UI development.
I expect clear communication regarding progress and any potential roadblocks.

## System Architecture
The application is built with an Expo React Native frontend utilizing Expo Router for file-based routing. The backend is an Express.js server. The AI architecture employs a multi-model strategy with 5 user-selectable providers: Raptor (gpt-4.1-mini, default), OpenAI (gpt-4o-mini), Anthropic (Claude Sonnet), Grok (grok-3-mini-fast), and Gemini (gemini-2.5-flash). Users select their preferred model in Command Center settings; if their chosen provider is unavailable, the system auto-falls back through all available providers. State management is handled by AsyncStorage for conversation persistence and React Context for shared application state.

**UI/UX Decisions:**
- **Color Scheme**: Deep forest green (#162E23) as primary, golden amber (#C9A24E) as accent, and warm cream (#FAF6EF) as background. Each agent has a distinct color accent.
- **Typography**: DM Sans (Google Fonts) is used throughout the application.
- **Design Principles**: Elite design standards are enforced for generated content, including glassmorphism, CSS custom properties, responsive layouts, entrance animations, and professional typography.
- **Rendering**: Custom markdown parser and HTML preview via iframe/WebView for rich content display.
- **Authentication**: A welcome screen for unauthenticated users, with an auth guard redirecting to `/auth` for protected screens, and a branded splash screen during auth state hydration.

**Technical Implementations & Features:**
- **Agent System**: 16 built-in AI agents categorized as "Core Agents" (Builder, Strategist, Writer, Code, Designer, Analyst) and "Tool Agents" (Branding, Thinker, SEO Pro, Page Gen, Content, Converter, GitHub, Optimizer, Cloner, QA Tester), each with specific functionalities.
- **Live Previews**: Builder, Code, and Designer agents offer live HTML previews for generated web applications, with a dedicated full-screen preview mode including device frames and source view.
- **Project Management**: Comprehensive project builder system allowing multi-file generation, saving to a database, inline file editing, version history, and one-click deployment to public URLs (`/live/:slug/`). Projects support data persistence via a per-project data API.
- **Conversation Management**: Features include creation, viewing, and deletion of conversations, with agent tagging and an intelligent memory system that extracts user preferences, tech stack, and business context for personalized responses. Conversation summarization is implemented for longer dialogues.
- **Subscription & Access Control**: A tiered subscription model (Free, Pro, Elite) is integrated with Stripe, managing access to agents, token limits, and features like HTML live previews and priority support. Usage tracking and upgrade prompts are part of the system.
- **Command Center**: An admin dashboard with sections for Overview, Analytics, Secrets, Integrations, Settings, Data, and Security.
- **Security**: Implemented with rate limiting on auth and AI endpoints, JWT authentication for protected API routes, input validation using Zod, and database transaction safety.

## External Dependencies
- **Stripe**: For subscription management, checkout, billing portal, and webhook handling.
- **@google/generative-ai**: Google Gemini SDK for Gemini model.
- **@anthropic-ai/sdk**: Anthropic SDK for Claude model.
- **@replit/ai-integrations**: Primary AI model (Raptor).
- **openai**: OpenAI SDK (also used for Grok via xAI base URL).
- **PostgreSQL**: Database managed via Replit, accessed using Drizzle ORM.
- **react-native-webview**: For rendering native HTML previews within the application.
- **express-rate-limit**: Middleware for rate limiting API requests.
- **react-native-reanimated**: For animations within the React Native application.
- **react-native-keyboard-controller**: For managing keyboard interactions in React Native.
- **@expo/vector-icons (Feather)**: Icon set used across the UI.

## Competitive Intelligence Features
- **Price Comparison Calculator**: Interactive comparison table on pricing screen and landing page showing real-world costs of Replit Agent, Bolt.new, Lovable, Cursor AI, and ChatGPT Pro vs Field of Dreams.
- **Annual Pricing Toggle**: Monthly/Annual billing toggle on both pricing screen and landing page. Annual saves ~20% (Pro: $9/mo billed $108/yr, Elite: $24/mo billed $288/yr). `shared/subscription.ts` includes `annualPrice`, `annualPriceLabel`, `annualMonthly` fields.
- **Pay-As-You-Go Overages**: Generous monthly credits (Pro: 1,500, Elite: 5,000) with low-cost pay-as-you-go after exceeding. Pro overage: $0.04/credit, Elite overage: $0.02/credit. Users are never locked out.
- **Premium Model Pricing**: Claude (Anthropic) costs 5x credits per generation to cover compute costs. Other models (Raptor, OpenAI, Grok, Gemini) are 1x. Defined in `PREMIUM_MODEL_MULTIPLIER` in `shared/subscription.ts`. `getEffectiveCreditCost()` calculates final credit cost factoring in model multiplier.
- **Memory & Business Profile**: User-editable memory management screen (`app/memory.tsx`) with two tabs — Memories (grouped by category with delete) and Business Profile (structured fields: company, industry, audience, brand voice, tech stack, competitors, website, goals). API routes: `GET/PUT /api/business-profile` in `server/routes.ts`. Business profile is injected into all agent system prompts via `getBusinessProfileBlock()` in `server/memory.ts` with prompt-injection sanitization.
- **Agent-to-Agent Handoff**: After AI responses, contextual "Continue with..." chips suggest related agents (`components/AgentHandoff.tsx`). Each agent in `constants/agents.ts` has a `handoffs` array mapping to relevant follow-up agents with labels and descriptions.
- **Landing Page Market Positioning**: Hero copy emphasizes "15 AI agents for less than one ChatGPT subscription." Competitor comparison table, transparency pledge, trust signals (security, Stripe, AI memory, dual models, cross-platform), and mobile-responsive layouts.
- **Cost Transparency Pledge**: "No surprise bills. Ever." messaging on pricing screen and landing page with guarantee boxes explaining credit-based billing.

## Deployed App Capabilities
- **Form Submission Collection**: Deployed apps can collect form submissions via `POST /live/:slug/api/forms/:formName`. Submissions stored in project_data with `form_<name>` collections. App owners can view all submissions in the project detail screen's Forms tab. Builder agent auto-generates forms that POST to this API.
- **Built-in Analytics**: Analytics tracking snippet auto-injected into all deployed project HTML. Tracks page views, device type (mobile/desktop), referrers. Events stored in project_data with `analytics` collection. Project detail screen has Analytics tab with total views, device breakdown, daily views chart, and top pages.
- **Asset Pipeline**: Builder agent system prompt mandates: favicon (SVG emoji), OG meta tags, web app manifest, structured data (JSON-LD), picsum.photos placeholders, apple-touch-icon, print stylesheet for every generated app.
- **QA Agent**: New QA Tester agent runs accessibility (WCAG 2.1 AA), responsiveness, performance, SEO, code quality, UX, and security audits. Structured QA reports with grades and specific code fixes.
- **Template Gallery**: 8 categories with 32 templates: Landing Pages, Dashboards, Portfolios, Tools & Utilities, Games, Storefronts, Business, Internal Tools.
- **OAuth Connector Infrastructure**: GET /api/connectors endpoint lists available connectors (Google Sheets, Stripe available; Calendar, SendGrid, Notion, Airtable, Supabase, Shopify coming soon). Connector management UI in Command Center's Integrations tab.