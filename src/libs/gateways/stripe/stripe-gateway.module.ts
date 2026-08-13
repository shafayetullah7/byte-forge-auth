import { Module } from '@nestjs/common';
import { StripeClientService } from './stripe-client.service';
import { StripeWebhookVerifier } from './verify-webhook';

@Module({
  providers: [StripeClientService, StripeWebhookVerifier],
  exports: [StripeClientService, StripeWebhookVerifier],
})
export class StripeGatewayModule {}
