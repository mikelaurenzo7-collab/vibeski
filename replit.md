# FIELD OF DREAMS

## Overview
FIELD OF DREAMS is a premium AI agent platform built as a mobile app with Expo React Native. It features 15 specialized AI agents, powered by a multi-model AI architecture (Raptor primary, Gemini fallback), streaming responses in real-time with rich markdown rendering and live HTML previews for generated apps/websites.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **AI**: Multi-model: Raptor (gpt-4.1-mini) primary, Gemini (gemini-2.5-flash) fallback
- **State**: AsyncStorage for conversation persistence, React Context for shared state
- **Font**: DM Sans (Google Fonts)
- **Rich Rendering**: Custom markdown parser, HTML preview via iframe/WebView
- **Payments**: Stripe integration for subscription management

## Subscription Tiers
- **Free**: 10 generations/day, Builder & Writer agents, 4K token limit
- **Pro ($19/mo)**: 100 generations/day, all 15 agents, 16K tokens, HTML live previews
- **Elite ($49/mo)**: Unlimited generations, all 15 agents, 16K tokens, priority support

## Multi-Model Strategy
- **Primary**: Raptor (gpt-4.1-mini via Replit AI Integrations) — fast, reliable, great for all agent types
- **Fallback**: Gemini (gemini-2.5-flash via Google API) — automatic failover if Raptor is unavailable
- Streaming is handled inline in routes.ts using dynamic imports for each provider
- The `for await` pattern works correctly with direct SDK stream objects in Express handlers

## Built-in Agents (15 total)
### Core Agents
- **Builder** (green) - Creates apps, sites & tools with live HTML previews [Free]
- **Strategist** (purple) - Business plans, growth strategy, competitive analysis [Pro+]
- **Writer** (orange) - Content creation, copywriting, storytelling [Free]
- **Code** (blue) - Programming, debugging, system architecture [Pro+]
- **Designer** (pink) - UI/UX, branding, visual design [Pro+]
- **Analyst** (teal) - Research, data analysis, market insights [Pro+]
### Tool Agents
- **Branding** (fuchsia) - Brand identity kits, color palettes, typography, style guides [Pro+]
- **Thinker** (indigo) - Design thinking, creative problem solving, user personas [Pro+]
- **SEO Pro** (emerald) - SEO auditing, keyword strategy, technical SEO [Pro+]
- **Page Gen** (green) - Programmatic SEO, scalable page generation [Pro+]
- **Content** (amber) - Social media content, newsletters, ad copy at scale [Pro+]
- **Converter** (slate) - Data format conversion (JSON, CSV, XML, SQL, etc.) [Pro+]
- **GitHub** (dark) - Open-source library discovery, stack comparison [Pro+]
- **Optimizer** (cyan) - Page speed, meta tags, CRO, App Store optimization [Pro+]
- **Cloner** (violet) - Website recreation, design analysis, pixel-perfect rebuilds [Pro+]

## Key Features
- **Agent Selection**: Home screen shows agents as cards; tap to start a conversation with that agent
- **Live HTML Preview**: Builder/Code/Designer agents can generate complete web apps rendered in-chat
- **Full-Screen App Preview**: Dedicated preview screen with device frame options (phone, tablet, desktop), landscape rotation, View Source toggle, and share button
- **Iterative Editing**: Edit button on preview navigates back to chat with context preserved for follow-up modifications
- **Template Gallery**: Curated prompt templates organized by category (Landing Pages, Dashboards, Portfolios, Tools, Games, Storefronts) on a dedicated screen
- **Elite Design Standards**: System prompts enforce glassmorphism, CSS custom properties, Google Fonts, responsive layouts, entrance animations, and professional typography in every generated app
- **Markdown Rendering**: Headers, bold, inline code, bullet points, numbered lists, blockquotes
- **Code Blocks**: Dark-themed with language labels and copy buttons
- **Streaming Responses**: Real-time SSE streaming with animated typing indicator
- **Conversation Management**: Create, view, delete; conversations tagged with their agent
- **Subscription Management**: Stripe-powered tiers with usage tracking and upgrade prompts
- **Usage Tracking**: Daily generation counts, usage pills in header, billing screen
- **Upgrade Modals**: Natural prompts when hitting limits or accessing locked agents

## Key Files
- `app/index.tsx` - Home screen with template gallery banner, agents grid, conversation list, usage pill, and personalized content
- `app/chat/[id].tsx` - Chat screen with agent-specific UI, streaming, preview navigation, and limit handling
- `app/auth.tsx` - Sign in / Sign up screen
- `app/projects.tsx` - My Projects dashboard with CRUD actions
- `app/profile.tsx` - Profile/settings screen with account info
- `app/preview.tsx` - Full-screen app preview with device frames, rotation, source view, share
- `app/templates.tsx` - Template gallery screen with categories and curated prompt starters
- `app/pricing.tsx` - Pricing screen with tier cards and Stripe checkout
- `app/billing.tsx` - Billing & usage screen with plan details and portal access
- `app/_layout.tsx` - Root layout with AuthProvider, ChatProvider, SubscriptionProvider, QueryClient
- `constants/agents.ts` - Agent definitions (prompts, colors, icons, suggestions)
- `constants/templates.ts` - Template category and template definitions (6 categories, 24 templates)
- `constants/colors.ts` - Theme colors
- `shared/schema.ts` - Drizzle schema (users, conversations, messages)
- `shared/subscription.ts` - Subscription tier config, types, and shared logic
- `lib/auth-context.tsx` - Authentication state management (JWT, user, login/signup/logout)
- `lib/chat-context.tsx` - Chat state management (dual mode: local for guests, server-backed for logged-in; conversations include agentId)
- `lib/subscription-context.tsx` - Subscription state (device ID, status, checkout, portal)
- `lib/stream-chat.ts` - SSE streaming client (passes agent system prompt, device ID)
- `lib/query-client.ts` - React Query client and API helpers
- `server/routes.ts` - Express API with /api/chat (Raptor+Gemini inline streaming), auth, conversations, subscription endpoints
- `server/auth.ts` - JWT middleware, password hashing utilities
- `server/models.ts` - Provider type definitions (minimal, streaming is inline in routes)
- `server/subscription.ts` - Server-side subscription & usage management, Stripe integration
- `server/storage.ts` - Database storage layer (Drizzle ORM)
- `server/db.ts` - Database connection (PostgreSQL pool)
- `components/MessageBubble.tsx` - Rich message bubbles with markdown + HTML preview + preview navigation
- `components/HtmlPreview.tsx` - Live HTML preview with browser-style dots, View Source toggle, fullscreen button
- `components/AgentCard.tsx` - Agent selection card with lock indicator for premium agents
- `components/ConversationItem.tsx` - Conversation list item with agent badge
- `components/UpgradeModal.tsx` - Upgrade prompt modal for limits and locked agents
- `components/ChatInput.tsx` - Message input with send button
- `components/TypingIndicator.tsx` - Animated typing dots

## API Endpoints
- `POST /api/chat` - Chat with streaming (enforces tier limits and agent access)
- `GET /api/subscription/status` - Get current subscription and usage status
- `POST /api/subscription/checkout` - Create Stripe checkout session
- `POST /api/subscription/portal` - Create Stripe billing portal session
- `POST /api/subscription/webhook` - Stripe webhook handler

## Color Theme
- Primary: #162E23 (deep forest green)
- Accent: #C9A24E (golden amber)
- Background: #FAF6EF (warm cream)
- Each agent has its own color accent

## Environment Variables
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` - Raptor model (primary, via Replit AI Integrations)
- `GOOGLE_API_KEY` - Google Gemini API key (fallback)
- `DATABASE_URL` - PostgreSQL connection string (auto-managed by Replit)
- `JWT_SECRET` - JWT signing secret (required in production, dev fallback provided)
- `SESSION_SECRET` - Session management
- `STRIPE_SECRET_KEY` - Stripe API key (required for payment features)
- `STRIPE_PRO_PRICE_ID` - Stripe price ID for Pro tier
- `STRIPE_ELITE_PRICE_ID` - Stripe price ID for Elite tier
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Technical Notes
- SSE streaming in Express: Uses inline `for await` directly on OpenAI/Gemini SDK stream objects. Wrapping streams in separate async generator classes causes buffering issues in Express POST handlers — keep streaming logic inline.
- CORS: Allows `Content-Type`, `Authorization`, and `x-device-id` headers

## Security & Hardening
- **Rate Limiting**: `express-rate-limit` on auth endpoints (20 req/15min) and AI endpoints (30 req/min)
- **Auth Required**: `/api/chat`, `/api/generate-image`, `/api/understand-image` all require JWT authentication
- **JWT Error Logging**: Auth middleware logs JWT verification failures for debugging
- **Input Validation**: Zod schemas validate conversation create/update payloads
- **Transaction Safety**: `saveMessages` uses a database transaction to prevent data loss on partial failure
- **Auth in Streaming**: `lib/stream-chat.ts` sends the auth token with streaming chat requests

## Dependencies (Notable)
- stripe - Stripe payment SDK
- @google/generative-ai - Google Gemini SDK
- express-rate-limit - Rate limiting middleware
- react-native-webview - For native HTML previews
- react-native-reanimated - Animations
- react-native-keyboard-controller - Keyboard handling
- @expo/vector-icons (Feather) - Icon set
