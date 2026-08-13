import type { TSubscriptionInvoiceStatus } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import type { TNewSubscriptionInvoice } from '@/_db/drizzle/schema/subscription/subscription-invoices.schema';

export type SubscriptionInvoiceProvider = TNewSubscriptionInvoice['provider'];

export type SubscriptionInvoiceFilters = {
  shopId: string;
  status?: TSubscriptionInvoiceStatus;
  provider?: SubscriptionInvoiceProvider;
  limit?: number;
  offset?: number;
};

export type SubscriptionInvoiceUpdateInput = Partial<{
  status: TSubscriptionInvoiceStatus;
  externalId: string | null;
  receiptUrl: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  paidAt: Date | null;
  metadata: Record<string, unknown> | null;
}>;
