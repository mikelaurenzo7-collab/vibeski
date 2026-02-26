# Field of Dreams

## Overview
Field of Dreams is an AI-powered chat assistant mobile app built with Expo React Native. It features streaming AI responses powered by OpenAI (via Replit AI Integrations), conversation management with local persistence, and a warm earthy design theme.

## Architecture
- **Frontend**: Expo Router (file-based routing), React Native
- **Backend**: Express.js server on port 5000
- **AI**: OpenAI GPT-5.2 via Replit AI Integrations (streaming SSE)
- **State**: AsyncStorage for conversation persistence, React Context for shared state
- **Font**: DM Sans (Google Fonts)

## Key Files
- `app/index.tsx` - Home screen with conversation list
- `app/chat/[id].tsx` - Chat screen with streaming AI responses
- `lib/chat-context.tsx` - Chat state management (AsyncStorage + Context)
- `lib/stream-chat.ts` - SSE streaming client using expo/fetch
- `server/routes.ts` - Express API with /api/chat streaming endpoint
- `components/MessageBubble.tsx` - Chat message bubbles
- `components/TypingIndicator.tsx` - Animated typing dots
- `components/ChatInput.tsx` - Message input with send button
- `components/ConversationItem.tsx` - Conversation list item
- `constants/colors.ts` - Theme colors (forest green, golden amber, cream)

## Color Theme
- Primary: #1B3A2D (forest green)
- Accent: #D4A853 (golden amber)
- Background: #FDF8F0 (warm cream)

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Environment
- AI_INTEGRATIONS_OPENAI_API_KEY / AI_INTEGRATIONS_OPENAI_BASE_URL - OpenAI via Replit
- SESSION_SECRET - Session management
