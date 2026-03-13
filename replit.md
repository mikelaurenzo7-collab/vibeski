# FIELD OF DREAMS

## Overview
FIELD OF DREAMS is a premium AI agent platform built as a mobile app with Expo React Native. It features 6 specialized AI agents (Builder, Strategist, Writer, Code, Designer, Analyst), each powered by cutting-edge multi-model AI (Grok + Claude), streaming responses in real-time with rich markdown rendering and live HTML previews for generated apps/websites.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **AI**: Multi-model: Grok (xAI) for creative agents, Claude 3.5 Haiku (Anthropic) for analytical agents
- **State**: AsyncStorage for conversation persistence, React Context for shared state
- **Font**: DM Sans (Google Fonts)
- **Rich Rendering**: Custom markdown parser, HTML preview via iframe/WebView

## Multi-Model Strategy (Wacky + Future-Proof)
- **Creative Agents** (Builder, Writer, Designer, Strategist) → **Grok (xAI)** — irreverent, boundary-pushing, real-time web knowledge
- **Analytical Agents** (Code, Analyst) → **Claude 3.5 Haiku (Anthropic)** — precise, reliable code generation, keeps Grok in check

This dual-model approach is genuinely unique: no competitor uses model diversity to create different agent personalities.

## Built-in Agents
- **Builder** (green, Grok) - Creates apps, sites & tools with live HTML previews
- **Strategist** (purple, Grok) - Business plans, growth strategy, competitive analysis
- **Writer** (orange, Grok) - Content creation, copywriting, storytelling
- **Code** (blue, Claude) - Programming, debugging, system architecture
- **Designer** (pink, Grok) - UI/UX, branding, visual design
- **Analyst** (teal, Claude) - Research, data analysis, market insights

## Key Features
- **Agent Selection**: Home screen shows agents as cards; tap to start a conversation with that agent
- **Multi-Model Routing**: Different agents powered by different AI models for personality diversity
- **Live HTML Preview**: Builder/Code/Designer agents can generate complete web apps rendered in-chat
- **Full-Screen App Preview**: Dedicated preview screen with device frame options (phone, tablet, desktop), landscape rotation, View Source toggle, and share button
- **Iterative Editing**: Edit button on preview navigates back to chat with context preserved for follow-up modifications
- **Template Gallery**: Curated prompt templates organized by category (Landing Pages, Dashboards, Portfolios, Tools, Games, Storefronts) on a dedicated screen
- **Elite Design Standards**: System prompts enforce glassmorphism, CSS custom properties, Google Fonts, responsive layouts, entrance animations, and professional typography in every generated app
- **Markdown Rendering**: Headers, bold, inline code, bullet points, numbered lists, blockquotes
- **Code Blocks**: Dark-themed with language labels and copy buttons
- **Streaming Responses**: Real-time SSE streaming with animated typing indicator
- **Conversation Management**: Create, view, delete; conversations tagged with their agent

## Key Files
- `app/index.tsx` - Home screen with template gallery banner, agents grid, and personalized content
- `app/chat/[id].tsx` - Chat screen with agent-specific UI, streaming, and preview navigation
- `app/auth.tsx` - Sign in / Sign up screen
- `app/projects.tsx` - My Projects dashboard with CRUD actions
- `app/profile.tsx` - Profile/settings screen with account info
- `app/preview.tsx` - Full-screen app preview with device frames, rotation, source view, share
- `app/templates.tsx` - Template gallery screen with categories and curated prompt starters
- `app/_layout.tsx` - Root layout with AuthProvider, ChatProvider, QueryClient
- `constants/agents.ts` - Agent definitions (prompts, colors, icons, suggestions)
- `constants/templates.ts` - Template category and template definitions (6 categories, 24 templates)
- `constants/colors.ts` - Theme colors
- `lib/auth-context.tsx` - Authentication state management (JWT, user, login/signup/logout)
- `lib/chat-context.tsx` - Chat state (dual mode: local for guests, server-backed for logged-in)
- `lib/stream-chat.ts` - SSE streaming client (passes agent system prompt to server)
- `lib/query-client.ts` - React Query client and API helpers
- `server/routes.ts` - Express API routes (auth, conversations, chat), elite design system prompts for all agents
- `server/auth.ts` - JWT middleware, password hashing utilities
- `server/storage.ts` - Database storage layer (Drizzle ORM)
- `server/db.ts` - Database connection (PostgreSQL pool)
- `shared/schema.ts` - Drizzle schema (users, conversations, messages)
- `components/MessageBubble.tsx` - Rich message bubbles with markdown + HTML preview + preview navigation
- `components/HtmlPreview.tsx` - Live HTML preview with browser-style dots, View Source toggle, fullscreen button
- `components/AgentCard.tsx` - Agent selection card for home screen
- `components/ConversationItem.tsx` - Conversation list item with agent badge
- `components/ChatInput.tsx` - Message input with send button
- `components/TypingIndicator.tsx` - Animated typing dots

## Color Theme
- Primary: #162E23 (deep forest green)
- Accent: #C9A24E (golden amber)
- Background: #FAF6EF (warm cream)
- Each agent has its own color accent

## Environment Variables
- `GROK_API_KEY` - xAI Grok API key (creative agents, with auto-fallback to Raptor)
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` - Raptor model (analytical agents + fallback)
- `DATABASE_URL` - PostgreSQL connection string (auto-managed by Replit)
- `JWT_SECRET` - JWT signing secret (required in production, dev fallback provided)

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Competitive Advantage
Multi-model agent specialization is genuinely unique:
- Different AI models power different agents
- Creates authentic personality diversity, not just prompt variation
- Grok's creativity + Claude's precision = best of both worlds
- Future-proof: can easily swap models as new ones emerge
- Hard to replicate at scale
