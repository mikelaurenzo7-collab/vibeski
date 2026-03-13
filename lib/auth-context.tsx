import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getApiUrl, queryClient } from '@/lib/query-client';

interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = '@field_of_dreams_token';
const USER_KEY = '@field_of_dreams_user';

let currentToken: string | null = null;

export function getAuthToken(): string | null {
  return currentToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (storedToken && storedUser) {
        currentToken = storedToken;
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const persistAuth = useCallback(async (t: string, u: AuthUser) => {
    currentToken = t;
    setToken(t);
    setUser(u);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, t),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
    ]);
  }, []);

  const clearAuth = useCallback(async () => {
    currentToken = null;
    setToken(null);
    setUser(null);
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    queryClient.clear();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const baseUrl = getApiUrl();
    const res = await fetch(new URL('/api/auth/login', baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    await persistAuth(data.token, data.user);
  }, [persistAuth]);

  const signup = useCallback(async (username: string, password: string, email?: string) => {
    const baseUrl = getApiUrl();
    const res = await fetch(new URL('/api/auth/signup', baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }
    await persistAuth(data.token, data.user);
  }, [persistAuth]);

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    isLoggedIn: !!user && !!token,
    login,
    signup,
    logout,
  }), [user, token, isLoading, login, signup, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
