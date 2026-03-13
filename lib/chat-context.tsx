import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';
import { useAuth, getAuthToken } from '@/lib/auth-context';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatContextValue {
  conversations: Conversation[];
  isLoading: boolean;
  createConversation: (agentId: string) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  getConversation: (id: string) => Conversation | undefined;
  saveMessages: (conversationId: string, messages: Message[]) => Promise<void>;
  duplicateConversation: (id: string) => Promise<Conversation | undefined>;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = '@field_of_dreams_conversations';

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }
  return { 'Content-Type': 'application/json' };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    loadConversations();
  }, [authLoading, isLoggedIn, user?.id]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      if (isLoggedIn) {
        const baseUrl = getApiUrl();
        const res = await fetch(new URL('/api/conversations', baseUrl).toString(), {
          headers: authHeaders(),
        });
        if (res.ok) {
          const serverConvos = await res.json();
          const mapped: Conversation[] = serverConvos.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            agentId: c.agentId || 'builder',
            messages: [],
            createdAt: new Date(c.createdAt).getTime(),
            updatedAt: new Date(c.updatedAt).getTime(),
          }));
          setConversations(mapped);
        }
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const migrated = parsed.map((c: any) => ({
            ...c,
            agentId: c.agentId || 'builder',
          }));
          setConversations(migrated);
        } else {
          setConversations([]);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [authLoading, isLoggedIn, user?.id]);

  const persistLocal = useCallback(async (convos: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  }, []);

  const createConversation = useCallback(async (agentId: string): Promise<Conversation> => {
    if (isLoggedIn) {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/conversations', baseUrl).toString(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ title: 'New Chat', agentId }),
      });
      if (!res.ok) {
        throw new Error('Failed to create conversation');
      }
      const serverConvo = await res.json();
      const newConvo: Conversation = {
        id: String(serverConvo.id),
        title: serverConvo.title,
        agentId: serverConvo.agentId,
        messages: [],
        createdAt: new Date(serverConvo.createdAt).getTime(),
        updatedAt: new Date(serverConvo.updatedAt).getTime(),
      };
      setConversations(prev => [newConvo, ...prev]);
      return newConvo;
    }
    const newConvo: Conversation = {
      id: generateId(),
      title: 'New Chat',
      agentId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => {
      const updated = [newConvo, ...prev];
      persistLocal(updated);
      return updated;
    });
    return newConvo;
  }, [isLoggedIn, persistLocal]);

  const deleteConversation = useCallback(async (id: string) => {
    if (isLoggedIn) {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/conversations/${id}`, baseUrl).toString(), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        console.error('Failed to delete conversation on server');
        return;
      }
    }
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (!isLoggedIn) persistLocal(updated);
      return updated;
    });
  }, [isLoggedIn, persistLocal]);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    if (isLoggedIn && updates.title) {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/conversations/${id}`, baseUrl).toString(), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ title: updates.title }),
      });
      if (!res.ok) {
        console.error('Failed to update conversation on server');
        return;
      }
    }
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      );
      if (!isLoggedIn) persistLocal(updated);
      return updated;
    });
  }, [isLoggedIn, persistLocal]);

  const getConversation = useCallback((id: string) => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const saveMessages = useCallback(async (conversationId: string, msgs: Message[]) => {
    if (isLoggedIn) {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/conversations/${conversationId}/messages`, baseUrl).toString(), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        console.error('Failed to save messages on server');
      }
    }
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c;
        const title = msgs.length > 0 && c.title === 'New Chat'
          ? msgs[0].content.slice(0, 40) + (msgs[0].content.length > 40 ? '...' : '')
          : c.title;
        return { ...c, messages: msgs, title, updatedAt: Date.now() };
      });
      if (!isLoggedIn) persistLocal(updated);
      return updated;
    });
  }, [isLoggedIn, persistLocal]);

  const duplicateConversation = useCallback(async (id: string): Promise<Conversation | undefined> => {
    if (isLoggedIn) {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/conversations/${id}/duplicate`, baseUrl).toString(), {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) {
        console.error('Failed to duplicate conversation on server');
        return undefined;
      }
      const serverConvo = await res.json();
      const newConvo: Conversation = {
        id: String(serverConvo.id),
        title: serverConvo.title,
        agentId: serverConvo.agentId,
        messages: [],
        createdAt: new Date(serverConvo.createdAt).getTime(),
        updatedAt: new Date(serverConvo.updatedAt).getTime(),
      };
      setConversations(prev => [newConvo, ...prev]);
      return newConvo;
    }
    const original = conversations.find(c => c.id === id);
    if (!original) return undefined;
    const newConvo: Conversation = {
      id: generateId(),
      title: `${original.title} (copy)`,
      agentId: original.agentId,
      messages: [...original.messages],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => {
      const updated = [newConvo, ...prev];
      persistLocal(updated);
      return updated;
    });
    return newConvo;
  }, [isLoggedIn, conversations, persistLocal]);

  const value = useMemo(() => ({
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversation,
    getConversation,
    saveMessages,
    duplicateConversation,
    refreshConversations,
  }), [conversations, isLoading, createConversation, deleteConversation, updateConversation, getConversation, saveMessages, duplicateConversation, refreshConversations]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
