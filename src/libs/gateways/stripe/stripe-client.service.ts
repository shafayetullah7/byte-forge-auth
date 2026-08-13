import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

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
      this.client = new Stripe(this.appConfig.stripeSecretKey!, {
        typescript: true,
      });
    }

    return this.client;
  }
}
