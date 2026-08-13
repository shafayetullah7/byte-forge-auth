import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import type { DrizzleTx } from '@/libs/db/types';
import { computeStatus } from '../../../domain';
import {
  mapStripeSubscriptionToUpsert,
  stripeUnixToDate,
} from '../stripe-webhook.util';
import { StripeSubscriptionWebhookContextService } from '../stripe-subscription-webhook-context.service';
import { ShopSubscriptionRepository } from '../../../repositories/shop-subscription.repository';

@Injectable()
export class CustomerSubscriptionDeletedHandler {
  constructor(
    private readonly contextService: StripeSubscriptionWebhookContextService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
  ) {}

  async handle(
    event: Stripe.Event,
    shopId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    const planId = this.contextService.resolvePlanIdFromEvent(event);
    const base = mapStripeSubscriptionToUpsert(subscription, planId);

    const periodEnd = subscription.ended_at
      ? stripeUnixToDate(subscription.ended_at)
      : base.currentPeriodEnd;

    await this.shopSubscriptionRepository.upsertByShopId(
      shopId,
      {
        ...base,
        currentPeriodEnd: periodEnd,
        status: computeStatus(periodEnd),
        billingProvider: SubscriptionBillingProviderEnum.STRIPE,
        cancelAtPeriodEnd: false,
      },
      tx,
    );
  }
}
