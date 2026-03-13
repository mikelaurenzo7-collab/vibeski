export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceLabel: string;
  features: string[];
  limits: {
    dailyGenerations: number;
    agents: 'basic' | 'all';
    maxTokens: number;
  };
  highlight?: boolean;
}

export const TIERS: TierConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    features: [
      '10 generations per day',
      'Builder & Writer agents',
      'Standard response speed',
      'Basic markdown rendering',
    ] as string[],
    limits: {
      dailyGenerations: 10,
      agents: 'basic',
      maxTokens: 4096,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1900,
    priceLabel: '$19',
    features: [
      '100 generations per day',
      'All 15 agents',
      'Priority response speed',
      'HTML live previews',
      'Extended context (16K tokens)',
    ] as string[],
    limits: {
      dailyGenerations: 100,
      agents: 'all',
      maxTokens: 16384,
    },
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 4900,
    priceLabel: '$49',
    features: [
      'Unlimited generations',
      'All 15 agents',
      'Fastest response speed',
      'HTML live previews',
      'Maximum context (16K tokens)',
      'Priority support',
    ] as string[],
    limits: {
      dailyGenerations: -1,
      agents: 'all',
      maxTokens: 16384,
    },
  },
];

export const FREE_AGENTS = ['builder', 'writer'];

export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return TIERS.find(t => t.id === tier) || TIERS[0];
}

export function canAccessAgent(tier: SubscriptionTier, agentId: string): boolean {
  if (tier === 'pro' || tier === 'elite') return true;
  return FREE_AGENTS.includes(agentId);
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  dailyGenerationsUsed: number;
  dailyGenerationsLimit: number;
  canGenerate: boolean;
}
