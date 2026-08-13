import type Stripe from 'stripe';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { stripeUnitAmountToBdtDecimal } from '@/libs/gateways/stripe/stripe-amount.util';
import { computeStatus } from '../../domain';
import type { ShopSubscriptionUpsertInput } from '../../repositories/shop-subscription.repository.types';

export const SUBSCRIPTION_STRIPE_METADATA_DOMAIN = 'subscription';

export const HANDLED_STRIPE_SUBSCRIPTION_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export function isSubscriptionStripeMetadata(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  return metadata?.domain === SUBSCRIPTION_STRIPE_METADATA_DOMAIN;
}

export function stripeUnixToDate(unixSeconds: number): Date {
  return new Date(unixSeconds * 1000);
}

export function resolveStripeCustomerId(
  customer: Stripe.Subscription['customer'],
): string | null {
  if (!customer) return null;
  return typeof customer === 'string' ? customer : (customer.id ?? null);
}

export function resolveStripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : (value.id ?? null);
}

export function getSubscriptionPeriodBounds(subscription: Stripe.Subscription): {
  periodStart: number;
  periodEnd: number;
} {
  const items = subscription.items?.data ?? [];
  if (items.length === 0) {
    throw new Error('Stripe subscription has no line items');
  }

  return {
    periodStart: Math.min(...items.map((item) => item.current_period_start)),
    periodEnd: Math.max(...items.map((item) => item.current_period_end)),
  };
}

export function mapStripeSubscriptionToUpsert(
  subscription: Stripe.Subscription,
  planId: string | null,
): ShopSubscriptionUpsertInput {
  const { periodEnd } = getSubscriptionPeriodBounds(subscription);
  const currentPeriodEnd = stripeUnixToDate(periodEnd);

  return {
    status: computeStatus(currentPeriodEnd),
    currentPeriodEnd,
    billingProvider: SubscriptionBillingProviderEnum.STRIPE,
    planId,
    stripeCustomerId: resolveStripeCustomerId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

export function resolveInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const fromParent = invoice.parent?.subscription_details?.subscription;
  const resolved = resolveStripeId(fromParent ?? null);
  if (resolved) {
    return resolved;
  }

  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | { id: string } | null;
    }
  ).subscription;

  return resolveStripeId(legacy ?? null);
}

export function stripeInvoiceAmountBdt(invoice: Stripe.Invoice): string {
  const paid = invoice.amount_paid ?? invoice.amount_due ?? 0;
  return stripeUnitAmountToBdtDecimal(paid);
}

export function extractPlanIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const planId = metadata?.planId;
  return typeof planId === 'string' && planId.length > 0 ? planId : null;
}
