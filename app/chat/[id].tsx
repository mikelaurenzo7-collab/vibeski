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
import { Ionicons } from '@expo/vector-icons';
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getConversation, saveMessages, createConversation } = useChat();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const conversation = getConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  const initializedRef = useRef(false);

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
        setMessages(prev => {
          saveMessages(id, prev);
          return prev;
        });
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
      <View style={styles.emptyIconWrap}>
        <Ionicons name="sparkles" size={32} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>How can I help?</Text>
      <Text style={styles.emptyText}>
        Ask me anything. I'm here to help you cultivate great ideas.
      </Text>
    </View>
  );

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
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerDot}>
            <Ionicons name="leaf" size={14} color={Colors.accent} />
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.title === 'New Chat' ? 'Field of Dreams' : (conversation?.title || 'Chat')}
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
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 168, 83, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.white,
  },
  headerSpacer: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
