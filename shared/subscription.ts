export type SubscriptionTier = 'free' | 'pro' | 'elite';

export interface CreditConfig {
  monthlyCredits: number;
  dailyCredits: number;
  overageRate: number;
  creditsPerGeneration: number;
}

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceLabel: string;
  annualPrice: number;
  annualPriceLabel: string;
  annualMonthly: string;
  features: string[];
  creditFeatures: string[];
  limits: {
    dailyGenerations: number;
    monthlyCredits: number;
    overageRate: number;
    agents: 'basic' | 'all';
    maxTokens: number;
  };
  highlight?: boolean;
}

export const CREDIT_COSTS: Record<string, number> = {
  builder: 1,
  writer: 1,
  strategist: 2,
  coder: 2,
  designer: 2,
  analyst: 2,
  branding: 2,
  'design-thinker': 2,
  seo: 3,
  'programmatic-seo': 3,
  'content-machine': 2,
  'file-converter': 1,
  'github-finder': 1,
  'seo-optimizer': 3,
  'website-cloner': 3,
  'qa-tester': 2,
};

export const PREMIUM_MODEL_MULTIPLIER: Record<string, number> = {
  raptor: 1,
  openai: 1,
  grok: 1,
  gemini: 1,
  anthropic: 5,
};

export function getEffectiveCreditCost(agentId: string, model: string): number {
  const base = CREDIT_COSTS[agentId] || 1;
  const multiplier = PREMIUM_MODEL_MULTIPLIER[model] || 1;
  return base * multiplier;
}

export const TIERS: TierConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    annualPrice: 0,
    annualPriceLabel: '$0',
    annualMonthly: '$0',
    features: [
      '2 agents (Builder + Writer)',
      'Basic markdown rendering',
      'Conversation history',
      '4K token responses',
    ] as string[],
    creditFeatures: [
      '25 credits per day',
      'Resets daily at midnight UTC',
      'Pay-as-you-go: $0.08/credit after that',
      '1 credit per generation',
    ] as string[],
    limits: {
      dailyGenerations: 25,
      monthlyCredits: 0,
      overageRate: 8,
      agents: 'basic',
      maxTokens: 4096,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1200,
    priceLabel: '$12',
    annualPrice: 10800,
    annualPriceLabel: '$108',
    annualMonthly: '$9',
    features: [
      'All 15 AI agents',
      'Live HTML previews',
      '16K token responses',
      'Command Center access',
      'Priority response speed',
    ] as string[],
    creditFeatures: [
      '1,500 credits per month',
      'Pay-as-you-go after that',
      '$0.04 per credit overage',
      '1-3 credits per generation',
      'Claude uses 5x credits',
    ] as string[],
    limits: {
      dailyGenerations: 200,
      monthlyCredits: 1500,
      overageRate: 4,
      agents: 'all',
      maxTokens: 16384,
    },
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 2900,
    priceLabel: '$29',
    annualPrice: 28800,
    annualPriceLabel: '$288',
    annualMonthly: '$24',
    features: [
      'Everything in Pro',
      'Fastest response speed',
      'Priority support',
      'Data export & API access',
      'Lowest overage rates',
    ] as string[],
    creditFeatures: [
      '5,000 credits per month',
      'Pay-as-you-go after that',
      '$0.02 per credit overage',
      '1-3 credits per generation',
      'Claude uses 5x credits',
    ] as string[],
    limits: {
      dailyGenerations: -1,
      monthlyCredits: 5000,
      overageRate: 2,
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

export function getCreditCost(agentId: string): number {
  return CREDIT_COSTS[agentId] || 1;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  dailyGenerationsUsed: number;
  dailyGenerationsLimit: number;
  canGenerate: boolean;
  monthlyCreditsUsed: number;
  monthlyCreditsLimit: number;
  overageCredits: number;
  overageRate: number;
  overageCost: number;
  billingCycleStart: string;
  billingCycleEnd: string;
}
