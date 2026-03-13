# Field of Dreams

## Overview
Field of Dreams is a premium AI agent mobile app built with Expo React Native. It features streaming AI responses powered by OpenAI GPT-5.2 (via Replit AI Integrations), rich content rendering with markdown formatting and live HTML previews, conversation management with local persistence, and a sophisticated nature-inspired design.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (streaming SSE, 16384 max tokens)
- **State**: AsyncStorage for conversation persistence, React Context for shared state
- **Font**: DM Sans (Google Fonts)
- **Rich Rendering**: Custom markdown parser, HTML preview via iframe/WebView

## Key Features
- **Agent Capabilities**: Can build complete web apps, landing pages, dashboards when prompted
- **Live HTML Preview**: Detects HTML code blocks and renders them in an interactive iframe
- **Markdown Rendering**: Headers, bold, inline code, bullet points, numbered lists
- **Code Blocks**: Dark-themed with language labels and copy buttons
- **Streaming Responses**: Real-time SSE streaming with animated typing indicator
- **Conversation Management**: Create, view, delete, auto-title conversations

## Key Files
- `app/index.tsx` - Home screen with conversation list
- `app/chat/[id].tsx` - Chat screen with streaming AI responses and suggestion chips
- `lib/chat-context.tsx` - Chat state management (AsyncStorage + Context)
- `lib/stream-chat.ts` - SSE streaming client using expo/fetch
- `server/routes.ts` - Express API with /api/chat streaming endpoint and agent system prompt
- `components/MessageBubble.tsx` - Rich message bubbles with markdown parsing and HTML detection
- `components/HtmlPreview.tsx` - Live HTML preview component (iframe on web, WebView on native)
- `components/TypingIndicator.tsx` - Animated typing dots with reanimated
- `components/ChatInput.tsx` - Message input with send button
- `components/ConversationItem.tsx` - Conversation list item with accent bar
- `constants/colors.ts` - Theme colors

## Color Theme
- Primary: #162E23 (deep forest green)
- Accent: #C9A24E (golden amber)
- Background: #FAF6EF (warm cream)
- Assistant bubbles: #FFFFFF with subtle border
- Code blocks: Primary dark theme

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
