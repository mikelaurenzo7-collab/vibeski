# Field of Dreams

## Overview
Field of Dreams is a premium AI agent platform built as a mobile app with Expo React Native. It features 6 specialized AI agents (Builder, Strategist, Writer, Code, Designer, Analyst), each with unique expertise, personality, and curated prompts. Responses stream in real-time with rich markdown rendering and live HTML previews for generated apps/websites.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (streaming SSE, 16384 max tokens)
- **State**: AsyncStorage for conversation persistence, React Context for shared state
- **Font**: DM Sans (Google Fonts)
- **Rich Rendering**: Custom markdown parser, HTML preview via iframe/WebView

## Built-in Agents
- **Builder** (green) - Creates apps, sites & tools with live HTML previews
- **Strategist** (purple) - Business plans, growth strategy, competitive analysis
- **Writer** (orange) - Content creation, copywriting, storytelling
- **Code** (blue) - Programming, debugging, system architecture
- **Designer** (pink) - UI/UX, branding, visual design
- **Analyst** (teal) - Research, data analysis, market insights

## Key Features
- **Agent Selection**: Home screen shows agents as cards; tap to start a conversation with that agent
- **Agent-Specific Prompts**: Each agent has tailored suggestion chips and system prompts
- **Live HTML Preview**: Builder/Code/Designer agents can generate complete web apps rendered in-chat
- **Markdown Rendering**: Headers, bold, inline code, bullet points, numbered lists
- **Code Blocks**: Dark-themed with language labels and copy buttons
- **Streaming Responses**: Real-time SSE streaming with animated typing indicator
- **Conversation Management**: Create, view, delete; conversations tagged with their agent

## Key Files
- `app/index.tsx` - Home screen with agents grid and conversation list
- `app/chat/[id].tsx` - Chat screen with agent-specific UI and streaming
- `constants/agents.ts` - Agent definitions (prompts, colors, icons, suggestions)
- `constants/colors.ts` - Theme colors
- `lib/chat-context.tsx` - Chat state management (conversations include agentId)
- `lib/stream-chat.ts` - SSE streaming client (passes agent system prompt to server)
- `server/routes.ts` - Express API with /api/chat endpoint (accepts systemPrompt)
- `components/MessageBubble.tsx` - Rich message bubbles with markdown + HTML preview
- `components/HtmlPreview.tsx` - Live HTML preview component (iframe on web, WebView on native)
- `components/AgentCard.tsx` - Agent selection card for home screen
- `components/TypingIndicator.tsx` - Animated typing dots
- `components/ChatInput.tsx` - Message input with send button
- `components/ConversationItem.tsx` - Conversation list item with agent badge

## Color Theme
- Primary: #162E23 (deep forest green)
- Accent: #C9A24E (golden amber)
- Background: #FAF6EF (warm cream)
- Each agent has its own color accent

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Environment
- AI_INTEGRATIONS_OPENAI_API_KEY / AI_INTEGRATIONS_OPENAI_BASE_URL - OpenAI via Replit
- SESSION_SECRET - Session management

## Dependencies (Notable)
- react-native-webview - For native HTML previews
- react-native-reanimated - Animations
- react-native-keyboard-controller - Keyboard handling
- @expo/vector-icons (Feather) - Icon set
