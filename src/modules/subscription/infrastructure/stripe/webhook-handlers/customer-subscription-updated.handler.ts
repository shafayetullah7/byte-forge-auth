import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import type { DrizzleTx } from '@/libs/db/types';
import { mapStripeSubscriptionToUpsert } from '../stripe-webhook.util';
import { StripeSubscriptionWebhookContextService } from '../stripe-subscription-webhook-context.service';
import { ShopSubscriptionRepository } from '../../../repositories/shop-subscription.repository';

@Injectable()
export class CustomerSubscriptionUpdatedHandler {
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

    await this.shopSubscriptionRepository.upsertByShopId(
      shopId,
      mapStripeSubscriptionToUpsert(subscription, planId),
      tx,
    );
  }
}
