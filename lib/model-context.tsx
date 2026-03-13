import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '@/lib/query-client';
import { useAuth, getAuthToken } from '@/lib/auth-context';

export type ModelProvider = 'raptor' | 'openai' | 'anthropic' | 'grok' | 'gemini';

export interface ModelConfig {
  id: ModelProvider;
  name: string;
  description: string;
  icon: string;
}

export const MODELS: Record<ModelProvider, ModelConfig> = {
  raptor: { id: 'raptor', name: 'Raptor (Primary)', description: 'Field of Dreams\' optimized model', icon: '🦅' },
  openai: { id: 'openai', name: 'GPT-4', description: 'OpenAI advanced reasoning', icon: '✨' },
  anthropic: { id: 'anthropic', name: 'Claude', description: 'Premium model — uses 5x credits', icon: '🧠' },
  grok: { id: 'grok', name: 'Grok', description: 'xAI witty and factual', icon: '⚡' },
  gemini: { id: 'gemini', name: 'Gemini', description: 'Google multimodal expert', icon: '🌐' },
};

interface ModelContextValue {
  preferredModel: ModelProvider;
  setPreferredModel: (model: ModelProvider) => Promise<void>;
  isLoading: boolean;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [preferredModel, setPreferredModelState] = useState<ModelProvider>('raptor');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    loadPreference();
  }, [authLoading, isLoggedIn]);

  const loadPreference = async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (token) {
        const res = await fetch(new URL('/api/model-preference', getApiUrl()).toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.model && data.model in MODELS) {
            setPreferredModelState(data.model);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load model preference:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const setPreferredModel = async (model: ModelProvider) => {
    setPreferredModelState(model);
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(new URL('/api/model-preference', getApiUrl()).toString(), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model }),
        });
      }
    } catch (e) {
      console.error('Failed to save model preference:', e);
    }
  };

  return (
    <ModelContext.Provider value={{ preferredModel, setPreferredModel, isLoading }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
