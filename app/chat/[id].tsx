import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import Colors from '@/constants/colors';
import { useChat, type Message } from '@/lib/chat-context';
import { streamChat } from '@/lib/stream-chat';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';

let messageCounter = 0;
function generateUniqueId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

const SUGGESTIONS = [
  { icon: 'globe' as const, label: 'Build a weather app', prompt: 'Build me a beautiful weather app with a 5-day forecast, current conditions with animated icons, and a clean modern UI' },
  { icon: 'layout' as const, label: 'Design a landing page', prompt: 'Build me a stunning SaaS landing page for a productivity tool called "FlowState" with hero section, features, pricing cards, and testimonials' },
  { icon: 'bar-chart-2' as const, label: 'Create a dashboard', prompt: 'Build me an analytics dashboard with revenue charts, user metrics, conversion rates, and a clean dark theme' },
  { icon: 'edit-3' as const, label: 'Write & create', prompt: 'Help me write a compelling pitch deck outline for a startup that uses AI to personalize education' },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getConversation, saveMessages } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const conversation = getConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  const initializedRef = useRef(false);
  const latestMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!id || (!conversation && !initializedRef.current)) {
      router.replace('/');
      return;
    }
    if (conversation?.messages && !initializedRef.current) {
      setMessages(conversation.messages);
      initializedRef.current = true;
    }
  }, [id, conversation?.messages]);

  const handleSend = async (text: string) => {
    if (isStreaming) return;

    const currentMessages = [...messages];
    const userMessage: Message = {
      id: generateUniqueId(),
      role: 'user',
      content: text,
    };

    const newMessages = [...currentMessages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);
    setShowTyping(true);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let fullContent = '';
    let assistantAdded = false;

    try {
      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      await streamChat(chatHistory, (chunk) => {
        fullContent += chunk;

        if (!assistantAdded) {
          setShowTyping(false);
          setMessages(prev => [...prev, {
            id: generateUniqueId(),
            role: 'assistant',
            content: fullContent,
          }]);
          assistantAdded = true;
        } else {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: fullContent,
            };
            return updated;
          });
        }
      });
    } catch (error) {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'assistant',
        content: 'I encountered an issue. Please try again.',
      }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
      if (id) {
        setTimeout(() => {
          saveMessages(id, latestMessagesRef.current);
        }, 0);
      }
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const reversedMessages = [...messages].reverse();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconOuter}>
        <View style={styles.emptyIconInner}>
          <Feather name="zap" size={24} color={Colors.accent} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>How can I help?</Text>
      <Text style={styles.emptyText}>
        Ask me anything or try a suggestion below
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => handleSend(s.prompt)}
            style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionPressed]}
          >
            <View style={styles.suggestionIcon}>
              <Feather name={s.icon} size={14} color={Colors.accent} />
            </View>
            <Text style={styles.suggestionText}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const displayTitle = conversation?.title === 'New Chat'
    ? 'New Conversation'
    : (conversation?.title || 'Conversation');

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: (insets.top || webTopInset) + 8 }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          testID="back-button"
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble role={item.role} content={item.content} />
          )}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.messageListEmpty,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!messages.length}
        />
        <View style={{ paddingBottom: insets.bottom || webBottomInset }}>
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
    letterSpacing: -0.1,
  },
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 16,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
  },
  suggestions: {
    width: '100%',
    gap: 8,
    marginTop: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  suggestionPressed: {
    backgroundColor: Colors.creamDark,
    transform: [{ scale: 0.98 }],
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
    letterSpacing: 0.1,
    flex: 1,
  },
});
