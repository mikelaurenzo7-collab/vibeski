import Stripe from 'stripe';
import type { SubscriptionTier, SubscriptionStatus } from '../shared/subscription';

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

const subscriptions = new Map<string, UserSubscription>();
const usage = new Map<string, UsageRecord>();

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getUsage(deviceId: string): UsageRecord {
  const existing = usage.get(deviceId);
  const today = todayKey();
  if (existing && existing.date === today) return existing;
  const record = { count: 0, date: today };
  usage.set(deviceId, record);
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

  const limits: Record<SubscriptionTier, number> = {
    free: 10,
    pro: 100,
    elite: -1,
  };

  const limit = limits[sub.tier];
  const canGenerate = limit === -1 || usageRecord.count < limit;

  return {
    tier: sub.tier,
    dailyGenerationsUsed: usageRecord.count,
    dailyGenerationsLimit: limit,
    canGenerate,
    stripeCustomerId: sub.stripeCustomerId,
  };
}

export function incrementUsage(deviceId: string): void {
  const record = getUsage(deviceId);
  record.count++;
  usage.set(deviceId, record);
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
