# FIELD OF DREAMS

## Overview
FIELD OF DREAMS is a premium AI agent platform built as a mobile app with Expo React Native. It features 6 specialized AI agents (Builder, Strategist, Writer, Code, Designer, Analyst), each with unique expertise, personality, and curated prompts. Responses stream in real-time with rich markdown rendering and live HTML previews for generated apps/websites.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL via Drizzle ORM (Replit built-in)
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (streaming SSE, 16384 max tokens)
- **Auth**: JWT-based authentication with bcryptjs password hashing
- **State**: React Context for shared state, AsyncStorage for guest mode, DB-backed for logged-in users
- **Font**: DM Sans (Google Fonts)
- **Rich Rendering**: Custom markdown parser, HTML preview via iframe/WebView

## Authentication
- JWT-based auth with signup/login endpoints
- Passwords hashed with bcryptjs
- Token stored in AsyncStorage on the client
- Auth middleware on all /api/conversations/* routes
- Guest mode: conversations stored locally in AsyncStorage
- Logged-in mode: conversations persisted to PostgreSQL database
- Auth context provides user state, login, signup, logout

## Built-in Agents
- **Builder** (green) - Creates apps, sites & tools with live HTML previews
- **Strategist** (purple) - Business plans, growth strategy, competitive analysis
- **Writer** (orange) - Content creation, copywriting, storytelling
- **Code** (blue) - Programming, debugging, system architecture
- **Designer** (pink) - UI/UX, branding, visual design
- **Analyst** (teal) - Research, data analysis, market insights

## Key Features
- **User Authentication**: Sign up, log in, guest mode with account creation prompts
- **Project Dashboard**: "My Projects" screen showing all saved conversations with management actions
- **Project Management**: Rename, duplicate, delete projects with confirmation dialogs
- **Agent Selection**: Home screen shows agents as cards; tap to start a conversation
- **Personalized Home**: Logged-in users see welcome message, recent projects, and quick access to Projects
- **Profile Screen**: Account info, stats, logout, and navigation to Projects
- **Agent-Specific Prompts**: Each agent has tailored suggestion chips and system prompts
- **Live HTML Preview**: Builder/Code/Designer agents can generate complete web apps rendered in-chat
- **Markdown Rendering**: Headers, bold, inline code, bullet points, numbered lists
- **Code Blocks**: Dark-themed with language labels and copy buttons
- **Streaming Responses**: Real-time SSE streaming with animated typing indicator
- **Conversation Management**: Create, view, rename, duplicate, delete; conversations tagged with agent

## Database Schema
- **users**: id (uuid), username (unique), password (bcrypt hash), email, created_at
- **conversations**: id (serial), user_id (FK to users), title, agent_id, created_at, updated_at
- **messages**: id (serial), conversation_id (FK to conversations), role, content, created_at

## API Endpoints
- POST /api/auth/signup - Create account (returns JWT)
- POST /api/auth/login - Login (returns JWT)
- GET /api/auth/me - Get current user (requires auth)
- GET /api/conversations - List user's conversations (requires auth)
- POST /api/conversations - Create conversation (requires auth)
- GET /api/conversations/:id - Get conversation with messages (requires auth)
- PUT /api/conversations/:id - Update conversation title (requires auth)
- DELETE /api/conversations/:id - Delete conversation (requires auth)
- POST /api/conversations/:id/duplicate - Duplicate conversation (requires auth)
- POST /api/conversations/:id/messages - Save messages (requires auth)
- POST /api/chat - Stream AI chat (no auth required, works for guests)

## Key Files
- `app/index.tsx` - Home screen with agents, personalized content, sign-up banner
- `app/chat/[id].tsx` - Chat screen with agent-specific UI and streaming
- `app/auth.tsx` - Sign in / Sign up screen
- `app/projects.tsx` - My Projects dashboard with CRUD actions
- `app/profile.tsx` - Profile/settings screen with account info
- `app/_layout.tsx` - Root layout with AuthProvider, ChatProvider, QueryClient
- `constants/agents.ts` - Agent definitions (prompts, colors, icons, suggestions)
- `constants/colors.ts` - Theme colors
- `lib/auth-context.tsx` - Authentication state management (JWT, user, login/signup/logout)
- `lib/chat-context.tsx` - Chat state (dual mode: local for guests, server-backed for logged-in)
- `lib/stream-chat.ts` - SSE streaming client
- `lib/query-client.ts` - React Query client and API helpers
- `server/routes.ts` - Express API routes (auth, conversations, chat)
- `server/auth.ts` - JWT middleware, password hashing utilities
- `server/storage.ts` - Database storage layer (Drizzle ORM)
- `server/db.ts` - Database connection (PostgreSQL pool)
- `shared/schema.ts` - Drizzle schema (users, conversations, messages)
- `components/MessageBubble.tsx` - Rich message bubbles with markdown + HTML preview
- `components/HtmlPreview.tsx` - Live HTML preview component
- `components/AgentCard.tsx` - Agent selection card for home screen
- `components/ConversationItem.tsx` - Conversation list item with agent badge
- `components/ChatInput.tsx` - Message input with send button
- `components/TypingIndicator.tsx` - Animated typing dots

## Color Theme
- Primary: #162E23 (deep forest green)
- Accent: #C9A24E (golden amber)
- Background: #FAF6EF (warm cream)
- Each agent has its own color accent

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Environment
- DATABASE_URL - PostgreSQL connection string
- AI_INTEGRATIONS_OPENAI_API_KEY / AI_INTEGRATIONS_OPENAI_BASE_URL - OpenAI via Replit
- JWT_SECRET - JWT signing secret (defaults to dev secret)

## Dependencies (Notable)
- bcryptjs / jsonwebtoken - Authentication
- drizzle-orm / pg - Database ORM and PostgreSQL client
- react-native-webview - For native HTML previews
- react-native-reanimated - Animations
- react-native-keyboard-controller - Keyboard handling
- @expo/vector-icons (Feather) - Icon set
