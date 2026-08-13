import { Injectable, Logger } from '@nestjs/common';
import type Stripe from 'stripe';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import type { DrizzleTx } from '@/libs/db/types';
import { StripeWebhookVerifier } from '@/libs/gateways/stripe/verify-webhook';
import { HANDLED_STRIPE_SUBSCRIPTION_EVENT_TYPES } from '../../infrastructure/stripe/stripe-webhook.util';
import { StripeSubscriptionWebhookContextService } from '../../infrastructure/stripe/stripe-subscription-webhook-context.service';
import {
  CheckoutSessionCompletedHandler,
  CustomerSubscriptionDeletedHandler,
  CustomerSubscriptionUpdatedHandler,
  InvoicePaidHandler,
} from '../../infrastructure/stripe/webhook-handlers';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionStripeWebhookEventRepository } from '../../repositories/subscription-stripe-webhook-event.repository';

export type ProcessStripeSubscriptionWebhookResult = {
  received: true;
  duplicate?: boolean;
  ignored?: boolean;
  eventType?: string;
};

@Injectable()
export class ProcessStripeSubscriptionWebhookCommand {
  private readonly logger = new Logger(
    ProcessStripeSubscriptionWebhookCommand.name,
  );

  constructor(
    private readonly db: DrizzleService,
    private readonly stripeWebhookVerifier: StripeWebhookVerifier,
    private readonly contextService: StripeSubscriptionWebhookContextService,
    private readonly webhookEventRepository: SubscriptionStripeWebhookEventRepository,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly checkoutSessionCompletedHandler: CheckoutSessionCompletedHandler,
    private readonly invoicePaidHandler: InvoicePaidHandler,
    private readonly customerSubscriptionUpdatedHandler: CustomerSubscriptionUpdatedHandler,
    private readonly customerSubscriptionDeletedHandler: CustomerSubscriptionDeletedHandler,
  ) {}

  async execute(
    payload: Buffer,
    signature: string | undefined,
  ): Promise<ProcessStripeSubscriptionWebhookResult> {
    const event = this.stripeWebhookVerifier.verify(payload, signature);

    if (!HANDLED_STRIPE_SUBSCRIPTION_EVENT_TYPES.has(event.type)) {
      return { received: true, ignored: true, eventType: event.type };
    }

    const shopId = await this.contextService.resolveShopId(event);
    if (!shopId) {
      this.logger.debug(`Ignoring Stripe event ${event.id} (${event.type})`);
      return { received: true, ignored: true, eventType: event.type };
    }

    const duplicate = await this.db.transaction(async (tx) => {
      const inserted = await this.webhookEventRepository.tryInsertEvent(
        event.id,
        event.type,
        tx,
      );

      if (!inserted) {
        return true;
      }

      await this.shopSubscriptionRepository.acquireShopLock(shopId, tx);
      await this.dispatch(event, shopId, tx);
      return false;
    });

    if (duplicate) {
      return { received: true, duplicate: true, eventType: event.type };
    }

    return { received: true, eventType: event.type };
  }

  private async dispatch(
    event: Stripe.Event,
    shopId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.checkoutSessionCompletedHandler.handle(event, shopId, tx);
        return;
      case 'invoice.paid':
        await this.invoicePaidHandler.handle(event, shopId, tx);
        return;
      case 'customer.subscription.updated':
        await this.customerSubscriptionUpdatedHandler.handle(event, shopId, tx);
        return;
      case 'customer.subscription.deleted':
        await this.customerSubscriptionDeletedHandler.handle(event, shopId, tx);
        return;
      default:
        return;
    }
  }
}
