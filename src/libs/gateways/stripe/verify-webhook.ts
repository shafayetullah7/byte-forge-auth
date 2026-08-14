import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import {
  constructStripeWebhookEvent,
  type Stripe,
} from './stripe-sdk';

@Injectable()
export class StripeWebhookVerifier {
  constructor(private readonly appConfig: AppConfigService) {}

  verify(payload: Buffer, signature: string | undefined): Stripe.Event {
    if (!signature) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }

    const webhookSecret = this.appConfig.stripeWebhookSecret;
    if (!webhookSecret) {
      throw new BadRequestException(
        'Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET.',
      );
    }

    try {
      return constructStripeWebhookEvent(payload, signature, webhookSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid Stripe webhook signature';
      throw new BadRequestException(message);
    }
  }
}

/** Standalone helper for tests or scripts. */
export function verifyStripeWebhookEvent(
  payload: Buffer,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  return constructStripeWebhookEvent(payload, signature, webhookSecret);
}
