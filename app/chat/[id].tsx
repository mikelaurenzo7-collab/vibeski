import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { getAgent } from '@/constants/agents';
import { useChat, type Message } from '@/lib/chat-context';
import { useAuth, getAuthToken } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';
import { streamChat } from '@/lib/stream-chat';
import { getApiUrl } from '@/lib/query-client';
import { parseMultiFileResponse } from '@/lib/file-parser';
import { MessageBubble } from '@/components/MessageBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChatInput } from '@/components/ChatInput';
import { UpgradeModal } from '@/components/UpgradeModal';
import { AgentHandoff } from '@/components/AgentHandoff';

let messageCounter = 0;
function generateUniqueId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function ChatScreen() {
  const { id, initialPrompt } = useLocalSearchParams<{ id: string; initialPrompt?: string }>();
  const insets = useSafeAreaInsets();
  const { conversations, saveMessages } = useChat();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { refreshStatus } = useSubscription();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn, authLoading]);

  const conversation = useMemo(() => conversations.find(c => c.id === id), [conversations, id]);
  const agent = getAgent(conversation?.agentId || 'builder');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ visible: boolean; reason: 'limit_reached' | 'agent_locked' }>({
    visible: false,
    reason: 'limit_reached',
  });

  const [projectId, setProjectId] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const initialPromptSentRef = useRef(false);
  const latestMessagesRef = useRef<Message[]>([]);
  const projectIdRef = useRef<number | null>(null);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (authLoading) return;
    if (!id || (!conversation && !initializedRef.current)) {
      router.replace('/');
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (isLoggedIn) {
        loadServerMessages();
      } else if (conversation?.messages) {
        setMessages(conversation.messages);
      }

      if (initialPrompt && !initialPromptSentRef.current && (!conversation?.messages || conversation.messages.length === 0)) {
        initialPromptSentRef.current = true;
        setTimeout(() => handleSend(initialPrompt), 500);
      }

      if (isLoggedIn && agent.id === 'builder') {
        loadExistingProject();
      }
    }
  }, [id, conversation?.messages, authLoading, isLoggedIn]);

  const loadExistingProject = async () => {
    try {
      const token = getAuthToken();
      if (!token || !id) return;
      const res = await fetch(
        new URL(`/api/projects/by-conversation/${id}`, getApiUrl()).toString(),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const existing = await res.json();
        if (existing && existing.id) {
          projectIdRef.current = existing.id;
          setProjectId(existing.id);
        }
      }
    } catch {}
  };

  const loadServerMessages = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/conversations/${id}`, baseUrl).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const mapped: Message[] = data.messages.map((m: any) => ({
            id: String(m.id),
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
          setMessages(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to load messages from server:', e);
      if (conversation?.messages) {
        setMessages(conversation.messages);
      }
    }
  };

  const createOrUpdateProject = useCallback(async (responseContent: string, userPrompt: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const parsedFiles = parseMultiFileResponse(responseContent);
      if (parsedFiles.length === 0) return;

      const baseUrl = getApiUrl();
      const currentProjectId = projectIdRef.current;

      if (currentProjectId) {
        await fetch(new URL(`/api/projects/${currentProjectId}`, baseUrl).toString(), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: parsedFiles.map(f => ({ filePath: f.path, content: f.content, fileType: f.type })),
          }),
        });
      } else {
        const projectName = userPrompt.length > 50 ? userPrompt.substring(0, 50) + '...' : userPrompt;
        const res = await fetch(new URL('/api/projects', baseUrl).toString(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            description: userPrompt,
            conversationId: parseInt(id || '0') || undefined,
            files: parsedFiles.map(f => ({ filePath: f.path, content: f.content, fileType: f.type })),
          }),
        });
        if (res.ok) {
          const project = await res.json();
          projectIdRef.current = project.id;
          setProjectId(project.id);
        }
      }
    } catch (e) {
      console.error('Failed to create/update project:', e);
    }
  }, [id]);

  const handleViewProject = useCallback((pid: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/project/[id]', params: { id: String(pid) } });
  }, []);

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
      }, agent.id, id);

      refreshStatus();

      if (agent.id === 'builder' && fullContent) {
        createOrUpdateProject(fullContent, text);
      }
    } catch (error) {
      setShowTyping(false);

      if (error instanceof Error) {
        if (error.message === 'AUTH_REQUIRED') {
          setMessages(currentMessages);
          setIsStreaming(false);
          router.push('/auth');
          return;
        }
        if (error.message === 'LIMIT_REACHED') {
          setMessages(currentMessages);
          setUpgradeModal({ visible: true, reason: 'limit_reached' });
          setIsStreaming(false);
          return;
        }
        if (error.message === 'AGENT_LOCKED') {
          setMessages(currentMessages);
          setUpgradeModal({ visible: true, reason: 'agent_locked' });
          setIsStreaming(false);
          return;
        }
      }

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

  const handleOpenPreview = (html: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/preview',
      params: { html, chatId: id },
    });
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
      <View style={[styles.emptyIconOuter, { borderColor: agent.colorLight }]}>
        <View style={[styles.emptyIconInner, { backgroundColor: agent.colorLight }]}>
          <Feather name={agent.icon} size={24} color={agent.color} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{agent.name}</Text>
      <Text style={styles.emptyTagline}>{agent.tagline}</Text>
      <View style={styles.suggestions}>
        {agent.suggestions.map((s, i) => (
          <Pressable
            key={i}
            onPress={() => handleSend(s.prompt)}
            style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionPressed]}
          >
            <Text style={styles.suggestionText}>{s.label}</Text>
            <Feather name="arrow-up-right" size={13} color={Colors.warmGrayLight} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  const displayTitle = conversation?.title === 'New Chat'
    ? agent.name
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
          <View style={[styles.headerAgentDot, { backgroundColor: agent.color }]}>
            <Feather name={agent.icon} size={10} color="#FFFFFF" />
          </View>
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
            <MessageBubble
              role={item.role}
              content={item.content}
              onOpenPreview={handleOpenPreview}
              projectId={item.role === 'assistant' ? projectId : undefined}
              onViewProject={handleViewProject}
            />
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
        {!isStreaming && messages.length > 0 && (
          <AgentHandoff
            agentId={agent.id}
            lastMessage={messages[messages.length - 1]?.content || ''}
          />
        )}
        <View style={{ paddingBottom: insets.bottom || webBottomInset }}>
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </View>
      </KeyboardAvoidingView>

      <UpgradeModal
        visible={upgradeModal.visible}
        onDismiss={() => setUpgradeModal({ ...upgradeModal, visible: false })}
        reason={upgradeModal.reason}
        agentName={agent.name}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerAgentDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
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
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.black,
    letterSpacing: -0.3,
  },
  emptyTagline: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  suggestions: {
    width: '100%',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  suggestionText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.blackSoft,
    letterSpacing: 0.1,
    flex: 1,
  },
});
