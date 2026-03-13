import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import type { SubscriptionTier, SubscriptionStatus } from '../shared/subscription';

const DEVICE_ID_KEY = '@field_of_dreams_device_id';

interface SubscriptionContextValue {
  deviceId: string | null;
  status: SubscriptionStatus;
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
  startCheckout: (tier: 'pro' | 'elite') => Promise<string | null>;
  openBillingPortal: () => Promise<string | null>;
  canAccessAgent: (agentId: string) => boolean;
}

const FREE_AGENTS = ['builder', 'writer'];

const DEFAULT_STATUS: SubscriptionStatus = {
  tier: 'free',
  dailyGenerationsUsed: 0,
  dailyGenerationsLimit: 10,
  canGenerate: true,
  monthlyCreditsUsed: 0,
  monthlyCreditsLimit: 0,
  overageCredits: 0,
  overageRate: 0,
  overageCost: 0,
  billingCycleStart: '',
  billingCycleEnd: '',
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initDeviceId();
  }, []);

  const initDeviceId = async () => {
    try {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
      await fetchStatus(id);
    } catch (e) {
      console.error('Failed to init device ID:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatus = async (id: string) => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL('/api/subscription/status', baseUrl);
      const res = await fetch(url.toString(), {
        headers: { 'x-device-id': id },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch subscription status:', e);
    }
  };

  const refreshStatus = useCallback(async () => {
    if (deviceId) {
      await fetchStatus(deviceId);
    }
  }, [deviceId]);

  const startCheckout = useCallback(async (tier: 'pro' | 'elite'): Promise<string | null> => {
    if (!deviceId) return null;
    try {
      const res = await apiRequest('POST', '/api/subscription/checkout', {
        tier,
        deviceId,
      });
      const data = await res.json();
      return data.url || null;
    } catch (e) {
      console.error('Failed to start checkout:', e);
      return null;
    }
  }, [deviceId]);

  const openBillingPortal = useCallback(async (): Promise<string | null> => {
    if (!deviceId) return null;
    try {
      const res = await apiRequest('POST', '/api/subscription/portal', {
        deviceId,
      });
      const data = await res.json();
      return data.url || null;
    } catch (e) {
      console.error('Failed to open billing portal:', e);
      return null;
    }
  }, [deviceId]);

  const canAccessAgent = useCallback((agentId: string): boolean => {
    if (status.tier === 'pro' || status.tier === 'elite') return true;
    return FREE_AGENTS.includes(agentId);
  }, [status.tier]);

  const value = useMemo(() => ({
    deviceId,
    status,
    isLoading,
    refreshStatus,
    startCheckout,
    openBillingPortal,
    canAccessAgent,
  }), [deviceId, status, isLoading, refreshStatus, startCheckout, openBillingPortal, canAccessAgent]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
