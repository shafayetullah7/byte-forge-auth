import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import type { DrizzleTx } from '@/libs/db/types';
import {
  getSubscriptionPeriodBounds,
  mapStripeSubscriptionToUpsert,
  resolveInvoiceSubscriptionId,
  stripeInvoiceAmountBdt,
  stripeUnixToDate,
} from '../stripe-webhook.util';
import { StripeSubscriptionWebhookContextService } from '../stripe-subscription-webhook-context.service';
import { ShopSubscriptionRepository } from '../../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../../repositories/subscription-invoice.repository';

@Injectable()
export class InvoicePaidHandler {
  constructor(
    private readonly contextService: StripeSubscriptionWebhookContextService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
  ) {}

  async handle(
    event: Stripe.Event,
    shopId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = resolveInvoiceSubscriptionId(invoice);
    if (!subscriptionId) {
      return;
    }

    const subscription =
      await this.contextService.retrieveSubscription(subscriptionId);
    const planId =
      this.contextService.resolvePlanIdFromEvent(event) ??
      (typeof subscription.metadata?.planId === 'string'
        ? subscription.metadata.planId
        : null);

    await this.shopSubscriptionRepository.upsertByShopId(
      shopId,
      mapStripeSubscriptionToUpsert(subscription, planId),
      tx,
    );

    const existing =
      await this.subscriptionInvoiceRepository.findByProviderAndExternalId(
        SubscriptionBillingProviderEnum.STRIPE,
        invoice.id,
        tx,
      );
    if (existing) {
      return;
    }

    const paidAt = invoice.status_transitions?.paid_at
      ? stripeUnixToDate(invoice.status_transitions.paid_at)
      : new Date();
    const { periodStart, periodEnd } = getSubscriptionPeriodBounds(subscription);

    await this.subscriptionInvoiceRepository.create(
      {
        shopId,
        planId,
        amountBdt: stripeInvoiceAmountBdt(invoice),
        currency: (invoice.currency ?? 'bdt').toUpperCase(),
        provider: SubscriptionBillingProviderEnum.STRIPE,
        status: SubscriptionInvoiceStatusEnum.PAID,
        externalId: invoice.id,
        receiptUrl: invoice.hosted_invoice_url ?? null,
        periodStart: invoice.period_start
          ? stripeUnixToDate(invoice.period_start)
          : stripeUnixToDate(periodStart),
        periodEnd: invoice.period_end
          ? stripeUnixToDate(invoice.period_end)
          : stripeUnixToDate(periodEnd),
        paidAt,
        metadata: {
          stripeInvoiceId: invoice.id,
          stripeSubscriptionId: subscription.id,
          source: 'stripe_invoice_paid',
        },
      },
      tx,
    );
  }
}
