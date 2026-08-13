import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import type { DrizzleTx } from '@/libs/db/types';
import {
  getSubscriptionPeriodBounds,
  mapStripeSubscriptionToUpsert,
  resolveStripeId,
  stripeUnixToDate,
} from '../stripe-webhook.util';
import { stripeUnitAmountToBdtDecimal } from '@/libs/gateways/stripe/stripe-amount.util';
import { StripeSubscriptionWebhookContextService } from '../stripe-subscription-webhook-context.service';
import { ShopSubscriptionRepository } from '../../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../../repositories/subscription-invoice.repository';

@Injectable()
export class CheckoutSessionCompletedHandler {
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
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId = resolveStripeId(session.subscription);
    if (!subscriptionId) {
      return;
    }

    const subscription =
      await this.contextService.retrieveSubscription(subscriptionId);
    const planId = this.contextService.resolvePlanIdFromEvent(event);

    await this.shopSubscriptionRepository.upsertByShopId(
      shopId,
      mapStripeSubscriptionToUpsert(subscription, planId),
      tx,
    );

    const pendingInvoice =
      await this.subscriptionInvoiceRepository.findByProviderAndExternalId(
        SubscriptionBillingProviderEnum.STRIPE,
        session.id,
        tx,
      );

    const paidAt = new Date();
    const { periodStart, periodEnd } = getSubscriptionPeriodBounds(subscription);
    const periodStartDate = stripeUnixToDate(periodStart);
    const periodEndDate = stripeUnixToDate(periodEnd);

    if (pendingInvoice) {
      await this.subscriptionInvoiceRepository.update(
        pendingInvoice.id,
        {
          status: SubscriptionInvoiceStatusEnum.PAID,
          paidAt,
          periodStart: periodStartDate,
          periodEnd: periodEndDate,
          receiptUrl: session.url ?? pendingInvoice.receiptUrl,
        },
        tx,
      );
      return;
    }

    await this.subscriptionInvoiceRepository.create(
      {
        shopId,
        planId,
        amountBdt:
          session.amount_total != null
            ? stripeUnitAmountToBdtDecimal(session.amount_total)
            : '0.00',
        currency: 'BDT',
        provider: SubscriptionBillingProviderEnum.STRIPE,
        status: SubscriptionInvoiceStatusEnum.PAID,
        externalId: session.id,
        receiptUrl: session.url ?? null,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
        paidAt,
        metadata: {
          checkoutSessionId: session.id,
          stripeSubscriptionId: subscription.id,
          source: 'stripe_checkout_session_completed',
        },
      },
      tx,
    );
  }
}
