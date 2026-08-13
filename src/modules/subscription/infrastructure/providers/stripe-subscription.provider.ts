import { Injectable } from '@nestjs/common';
import type Stripe from 'stripe';
import { AppEnvService } from '@/_config/app-env/app-env.service';
import { StripeClientService } from '@/libs/gateways/stripe/stripe-client.service';

export type CreateStripeSubscriptionCheckoutInput = {
  shopId: string;
  planId: string;
  stripePriceId: string;
  stripeCustomerId?: string | null;
  customerEmail?: string | null;
};

export type StripeSubscriptionCheckoutResult = {
  url: string;
  sessionId: string;
};

const CHECKOUT_METADATA_DOMAIN = 'subscription';

@Injectable()
export class StripeSubscriptionProvider {
  constructor(
    private readonly stripeClientService: StripeClientService,
    private readonly appEnv: AppEnvService,
  ) {}

  async createSubscriptionCheckoutSession(
    input: CreateStripeSubscriptionCheckoutInput,
  ): Promise<StripeSubscriptionCheckoutResult> {
    const stripe = this.stripeClientService.requireConfigured();
    const frontendUrl = this.getFrontendUrl();
    const metadata = {
      shopId: input.shopId,
      planId: input.planId,
      domain: CHECKOUT_METADATA_DOMAIN,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: input.stripePriceId, quantity: 1 }],
      success_url: `${frontendUrl}/app/seller/subscription?checkout=success`,
      cancel_url: `${frontendUrl}/app/seller/subscription?checkout=cancel`,
      metadata,
      subscription_data: { metadata },
      ...(input.stripeCustomerId
        ? { customer: input.stripeCustomerId }
        : input.customerEmail
          ? { customer_email: input.customerEmail }
          : {}),
    });

    if (!session.url) {
      throw new Error('Stripe Checkout session did not return a URL');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    const stripe = this.stripeClientService.requireConfigured();
    return stripe.checkout.sessions.retrieve(sessionId);
  }

  async retrieveSubscription(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription> {
    const stripe = this.stripeClientService.requireConfigured();
    return stripe.subscriptions.retrieve(stripeSubscriptionId);
  }

  private getFrontendUrl(): string {
    return (this.appEnv.FRONTEND_URL ?? '').replace(/\/$/, '');
  }
}
