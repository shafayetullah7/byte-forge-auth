import type { TShopSubscription } from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import type { TSubscriptionInvoice } from '@/_db/drizzle/schema/subscription/subscription-invoices.schema';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { computeStatus, SubscriptionStatus } from '../domain';

export type SubscriptionInvoiceSummary = {
  id: string;
  amountBdt: string;
  currency: string;
  provider: string;
  status: string;
  receiptUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminShopSubscriptionResponse = {
  shopId: string;
  status: string;
  currentPeriodEnd: string | null;
  billingProvider: string;
  planId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  recentInvoices: SubscriptionInvoiceSummary[];
};

export function toSubscriptionInvoiceSummary(
  row: TSubscriptionInvoice,
): SubscriptionInvoiceSummary {
  return {
    id: row.id,
    amountBdt: row.amountBdt,
    currency: row.currency,
    provider: row.provider,
    status: row.status,
    receiptUrl: row.receiptUrl ?? null,
    periodStart: row.periodStart?.toISOString() ?? null,
    periodEnd: row.periodEnd?.toISOString() ?? null,
    paidAt: row.paidAt?.toISOString() ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminShopSubscriptionResponse(
  shopId: string,
  subscription: TShopSubscription | null,
  invoices: TSubscriptionInvoice[],
  now: Date = new Date(),
): AdminShopSubscriptionResponse {
  if (!subscription) {
    return {
      shopId,
      status: SubscriptionStatus.NONE,
      currentPeriodEnd: null,
      billingProvider: SubscriptionBillingProviderEnum.NONE,
      planId: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      createdAt: null,
      updatedAt: null,
      recentInvoices: invoices.map(toSubscriptionInvoiceSummary),
    };
  }

  return {
    shopId,
    status: computeStatus(subscription.currentPeriodEnd, now),
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
    billingProvider: subscription.billingProvider,
    planId: subscription.planId ?? null,
    stripeCustomerId: subscription.stripeCustomerId ?? null,
    stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
    recentInvoices: invoices.map(toSubscriptionInvoiceSummary),
  };
}
