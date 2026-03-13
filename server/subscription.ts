import Stripe from 'stripe';
import type { SubscriptionTier, SubscriptionStatus } from '../shared/subscription';
import { getCreditCost, getTierConfig } from '../shared/subscription';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

interface UserSubscription {
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface UsageRecord {
  count: number;
  date: string;
}

interface MonthlyUsageRecord {
  creditsUsed: number;
  overageCredits: number;
  cycleStart: string;
  cycleEnd: string;
}

const subscriptions = new Map<string, UserSubscription>();
const usage = new Map<string, UsageRecord>();
const monthlyUsage = new Map<string, MonthlyUsageRecord>();

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentCycle(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getUsage(deviceId: string): UsageRecord {
  const existing = usage.get(deviceId);
  const today = todayKey();
  if (existing && existing.date === today) return existing;
  const record = { count: 0, date: today };
  usage.set(deviceId, record);
  return record;
}

function getMonthlyUsage(deviceId: string): MonthlyUsageRecord {
  const cycle = getCurrentCycle();
  const existing = monthlyUsage.get(deviceId);
  if (existing && existing.cycleStart === cycle.start) return existing;
  const record: MonthlyUsageRecord = {
    creditsUsed: 0,
    overageCredits: 0,
    cycleStart: cycle.start,
    cycleEnd: cycle.end,
  };
  monthlyUsage.set(deviceId, record);
  return record;
}

export function getSubscription(deviceId: string): UserSubscription {
  return subscriptions.get(deviceId) || { tier: 'free' };
}

export function setSubscription(deviceId: string, sub: UserSubscription): void {
  subscriptions.set(deviceId, sub);
}

export function getSubscriptionStatus(deviceId: string): SubscriptionStatus & { stripeCustomerId?: string } {
  const sub = getSubscription(deviceId);
  const usageRecord = getUsage(deviceId);
  const monthly = getMonthlyUsage(deviceId);
  const tierConfig = getTierConfig(sub.tier);
  const cycle = getCurrentCycle();

  const dailyLimit = tierConfig.limits.dailyGenerations;
  const monthlyLimit = tierConfig.limits.monthlyCredits;
  const overageRate = tierConfig.limits.overageRate;

  let canGenerate: boolean;
  if (sub.tier === 'free') {
    canGenerate = usageRecord.count < dailyLimit;
  } else {
    canGenerate = true;
  }

  const overageCredits = monthlyLimit > 0
    ? Math.max(0, monthly.creditsUsed - monthlyLimit)
    : 0;
  const overageCost = overageCredits * overageRate;

  return {
    tier: sub.tier,
    dailyGenerationsUsed: usageRecord.count,
    dailyGenerationsLimit: dailyLimit,
    canGenerate,
    monthlyCreditsUsed: monthly.creditsUsed,
    monthlyCreditsLimit: monthlyLimit,
    overageCredits,
    overageRate,
    overageCost,
    billingCycleStart: cycle.start,
    billingCycleEnd: cycle.end,
    stripeCustomerId: sub.stripeCustomerId,
  };
}

export function incrementUsage(deviceId: string, agentId?: string): number {
  const record = getUsage(deviceId);
  record.count++;
  usage.set(deviceId, record);

  const sub = getSubscription(deviceId);
  if (sub.tier !== 'free') {
    const creditCost = getCreditCost(agentId || 'builder');
    const monthly = getMonthlyUsage(deviceId);
    monthly.creditsUsed += creditCost;
    monthlyUsage.set(deviceId, monthly);
    return creditCost;
  }

  return 1;
}

export async function createCheckoutSession(
  deviceId: string,
  tier: 'pro' | 'elite',
  successUrl: string,
  cancelUrl: string,
): Promise<string | null> {
  if (!stripe) {
    console.error('Stripe not configured');
    return null;
  }

  const priceIds: Record<string, string | undefined> = {
    pro: process.env.STRIPE_PRO_PRICE_ID,
    elite: process.env.STRIPE_ELITE_PRICE_ID,
  };

  const priceId = priceIds[tier];
  if (!priceId) {
    console.error(`No price ID configured for tier: ${tier}`);
    return null;
  }

  let sub = getSubscription(deviceId);
  let customerId = sub.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { deviceId },
    });
    customerId = customer.id;
    setSubscription(deviceId, { ...sub, stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { deviceId, tier },
  });

  return session.url;
}

export async function createPortalSession(deviceId: string, returnUrl: string): Promise<string | null> {
  if (!stripe) return null;

  const sub = getSubscription(deviceId);
  if (!sub.stripeCustomerId) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

export async function handleWebhook(
  body: Buffer,
  signature: string,
): Promise<void> {
  if (!stripe) return;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw err;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const deviceId = session.metadata?.deviceId;
      const tier = session.metadata?.tier as SubscriptionTier | undefined;
      if (deviceId && tier) {
        setSubscription(deviceId, {
          tier,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      for (const [deviceId, sub] of subscriptions.entries()) {
        if (sub.stripeCustomerId === customerId) {
          if (subscription.status === 'active') {
            const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
            const elitePriceId = process.env.STRIPE_ELITE_PRICE_ID;
            const itemPriceId = subscription.items.data[0]?.price?.id;
            let tier: SubscriptionTier = 'free';
            if (itemPriceId === elitePriceId) tier = 'elite';
            else if (itemPriceId === proPriceId) tier = 'pro';
            setSubscription(deviceId, { ...sub, tier, stripeSubscriptionId: subscription.id });
          }
          break;
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      for (const [deviceId, sub] of subscriptions.entries()) {
        if (sub.stripeCustomerId === customerId) {
          setSubscription(deviceId, { ...sub, tier: 'free', stripeSubscriptionId: undefined });
          break;
        }
      }
      break;
    }
  }
}

export function getStripeInstance(): Stripe | null {
  return stripe;
}
