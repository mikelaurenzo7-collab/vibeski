import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

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
  createConversation: (agentId: string) => Conversation;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  getConversation: (id: string) => Conversation | undefined;
  saveMessages: (conversationId: string, messages: Message[]) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const STORAGE_KEY = '@field_of_dreams_conversations';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((c: any) => ({
          ...c,
          agentId: c.agentId || 'builder',
        }));
        setConversations(migrated);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = useCallback(async (convos: Conversation[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
    } catch (e) {
      console.error('Failed to save conversations:', e);
    }
  }, []);

  const createConversation = useCallback((agentId: string) => {
    const newConvo: Conversation = {
      id: Crypto.randomUUID(),
      title: 'New Chat',
      agentId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations(prev => {
      const updated = [newConvo, ...prev];
      persist(updated);
      return updated;
    });
    return newConvo;
  }, [persist]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      persist(updated);
      return updated;
    });
  }, [persist]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      );
      persist(updated);
      return updated;
    });
  }, [persist]);

  const getConversation = useCallback((id: string) => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const saveMessages = useCallback((conversationId: string, messages: Message[]) => {
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id !== conversationId) return c;
        const title = messages.length > 0 && c.title === 'New Chat'
          ? messages[0].content.slice(0, 40) + (messages[0].content.length > 40 ? '...' : '')
          : c.title;
        return { ...c, messages, title, updatedAt: Date.now() };
      });
      persist(updated);
      return updated;
    });
  }, [persist]);

  const value = useMemo(() => ({
    conversations,
    isLoading,
    createConversation,
    deleteConversation,
    updateConversation,
    getConversation,
    saveMessages,
  }), [conversations, isLoading, createConversation, deleteConversation, updateConversation, getConversation, saveMessages]);

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
