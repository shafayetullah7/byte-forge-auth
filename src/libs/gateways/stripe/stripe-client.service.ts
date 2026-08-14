import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { createStripeClient, type Stripe } from './stripe-sdk';

@Injectable()
export class StripeClientService {
  private client: Stripe | null = null;

  constructor(private readonly appConfig: AppConfigService) {}

  isConfigured(): boolean {
    return this.appConfig.isStripeConfigured;
  }

  requireConfigured(): Stripe {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY in the environment.',
      );
    }

    if (!this.client) {
      this.client = createStripeClient(this.appConfig.stripeSecretKey!);
    }

    return this.client;
  }
}
