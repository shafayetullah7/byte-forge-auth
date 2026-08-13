import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProcessStripeSubscriptionWebhookCommand } from '../application/commands/process-stripe-subscription-webhook.command';

@ApiTags('🔔 Webhooks - Stripe Subscription')
@ApiExcludeController()
@Controller({ path: 'webhooks/stripe/subscription', version: '1' })
export class StripeSubscriptionWebhookController {
  constructor(
    private readonly processStripeSubscriptionWebhookCommand: ProcessStripeSubscriptionWebhookCommand,
  ) {}

  @ApiOperation({ summary: 'Stripe subscription webhook endpoint' })
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      throw new BadRequestException(
        'Raw body is required for Stripe webhook verification',
      );
    }

    return this.processStripeSubscriptionWebhookCommand.execute(
      payload,
      signature,
    );
  }
}
