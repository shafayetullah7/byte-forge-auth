import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { StripeClientService } from '@/libs/gateways/stripe/stripe-client.service';
import {
  extractPlanIdFromMetadata,
  isSubscriptionStripeMetadata,
  resolveInvoiceSubscriptionId,
  resolveStripeId,
} from './stripe-webhook.util';

@Injectable()
export class StripeSubscriptionWebhookContextService {
  constructor(private readonly stripeClientService: StripeClientService) {}

  async resolveShopId(event: Stripe.Event): Promise<string | null> {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.shopIdFromCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
        );
      case 'invoice.paid':
        return this.shopIdFromInvoice(event.data.object as Stripe.Invoice);
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.shopIdFromSubscription(
          event.data.object as Stripe.Subscription,
        );
      default:
        return null;
    }
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const stripe = this.stripeClientService.requireConfigured();
    return stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data'],
    });
  }

  private shopIdFromCheckoutSession(
    session: Stripe.Checkout.Session,
  ): string | null {
    if (!isSubscriptionStripeMetadata(session.metadata)) {
      return null;
    }
    return typeof session.metadata?.shopId === 'string'
      ? session.metadata.shopId
      : null;
  }

  private async shopIdFromInvoice(
    invoice: Stripe.Invoice,
  ): Promise<string | null> {
    if (isSubscriptionStripeMetadata(invoice.metadata)) {
      return typeof invoice.metadata?.shopId === 'string'
        ? invoice.metadata.shopId
        : null;
    }

    const subscriptionId = resolveInvoiceSubscriptionId(invoice);
    if (!subscriptionId) {
      return null;
    }

    const subscription = await this.retrieveSubscription(subscriptionId);
    if (!isSubscriptionStripeMetadata(subscription.metadata)) {
      return null;
    }

    return typeof subscription.metadata?.shopId === 'string'
      ? subscription.metadata.shopId
      : null;
  }

  private shopIdFromSubscription(
    subscription: Stripe.Subscription,
  ): string | null {
    if (!isSubscriptionStripeMetadata(subscription.metadata)) {
      return null;
    }
    return typeof subscription.metadata?.shopId === 'string'
      ? subscription.metadata.shopId
      : null;
  }

  resolvePlanIdFromEvent(event: Stripe.Event): string | null {
    switch (event.type) {
      case 'checkout.session.completed':
        return extractPlanIdFromMetadata(
          (event.data.object as Stripe.Checkout.Session).metadata,
        );
      case 'invoice.paid':
        return extractPlanIdFromMetadata(
          (event.data.object as Stripe.Invoice).metadata,
        );
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return extractPlanIdFromMetadata(
          (event.data.object as Stripe.Subscription).metadata,
        );
      default:
        return null;
    }
  }
}
