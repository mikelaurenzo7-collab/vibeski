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
};

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
      '10 credits per day',
      'Resets daily at midnight UTC',
      'No overage billing',
      '1 credit per generation',
    ] as string[],
    limits: {
      dailyGenerations: 10,
      monthlyCredits: 0,
      overageRate: 0,
      agents: 'basic',
      maxTokens: 4096,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1900,
    priceLabel: '$19',
    annualPrice: 18200,
    annualPriceLabel: '$182',
    annualMonthly: '$15',
    features: [
      'All 15 AI agents',
      'Live HTML previews',
      '16K token responses',
      'Command Center access',
      'Priority response speed',
    ] as string[],
    creditFeatures: [
      '500 credits per month',
      'Unused credits don\'t roll over',
      '$0.05 per credit overage',
      '1-3 credits per generation',
    ] as string[],
    limits: {
      dailyGenerations: 100,
      monthlyCredits: 500,
      overageRate: 5,
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
    annualPrice: 47000,
    annualPriceLabel: '$470',
    annualMonthly: '$39',
    features: [
      'Everything in Pro',
      'Fastest response speed',
      'Priority support',
      'Data export & API access',
      'Lowest overage rates',
    ] as string[],
    creditFeatures: [
      '2,000 credits per month',
      'Unused credits don\'t roll over',
      '$0.03 per credit overage',
      '1-3 credits per generation',
    ] as string[],
    limits: {
      dailyGenerations: -1,
      monthlyCredits: 2000,
      overageRate: 3,
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
