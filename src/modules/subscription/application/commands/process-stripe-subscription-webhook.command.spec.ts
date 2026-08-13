import type Stripe from 'stripe';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { StripeWebhookVerifier } from '@/libs/gateways/stripe/verify-webhook';
import { StripeSubscriptionWebhookContextService } from '../../infrastructure/stripe/stripe-subscription-webhook-context.service';
import {
  CheckoutSessionCompletedHandler,
  CustomerSubscriptionDeletedHandler,
  CustomerSubscriptionUpdatedHandler,
  InvoicePaidHandler,
} from '../../infrastructure/stripe/webhook-handlers';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionStripeWebhookEventRepository } from '../../repositories/subscription-stripe-webhook-event.repository';
import { ProcessStripeSubscriptionWebhookCommand } from './process-stripe-subscription-webhook.command';

describe('ProcessStripeSubscriptionWebhookCommand', () => {
  const shopId = '11111111-1111-4111-8111-111111111111';
  const payload = Buffer.from('{}');

  const event: Stripe.Event = {
    id: 'evt_123',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_123',
        metadata: { shopId, planId: 'plan-1', domain: 'subscription' },
      },
    },
  } as unknown as Stripe.Event;

  let db: { transaction: jest.Mock };
  let stripeWebhookVerifier: { verify: jest.Mock };
  let contextService: { resolveShopId: jest.Mock };
  let webhookEventRepository: { tryInsertEvent: jest.Mock };
  let shopSubscriptionRepository: { acquireShopLock: jest.Mock };
  let checkoutSessionCompletedHandler: { handle: jest.Mock };
  let command: ProcessStripeSubscriptionWebhookCommand;

  beforeEach(() => {
    db = {
      transaction: jest.fn(async (callback) => callback({})),
    };
    stripeWebhookVerifier = {
      verify: jest.fn().mockReturnValue(event),
    };
    contextService = {
      resolveShopId: jest.fn().mockResolvedValue(shopId),
    };
    webhookEventRepository = {
      tryInsertEvent: jest.fn().mockResolvedValue(true),
    };
    shopSubscriptionRepository = {
      acquireShopLock: jest.fn().mockResolvedValue(undefined),
    };
    checkoutSessionCompletedHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };

    command = new ProcessStripeSubscriptionWebhookCommand(
      db as unknown as DrizzleService,
      stripeWebhookVerifier as unknown as StripeWebhookVerifier,
      contextService as unknown as StripeSubscriptionWebhookContextService,
      webhookEventRepository as unknown as SubscriptionStripeWebhookEventRepository,
      shopSubscriptionRepository as unknown as ShopSubscriptionRepository,
      checkoutSessionCompletedHandler as unknown as CheckoutSessionCompletedHandler,
      { handle: jest.fn() } as unknown as InvoicePaidHandler,
      { handle: jest.fn() } as unknown as CustomerSubscriptionUpdatedHandler,
      { handle: jest.fn() } as unknown as CustomerSubscriptionDeletedHandler,
    );
  });

  it('processes a new webhook event under shop lock', async () => {
    const result = await command.execute(payload, 'sig');

    expect(stripeWebhookVerifier.verify).toHaveBeenCalledWith(payload, 'sig');
    expect(webhookEventRepository.tryInsertEvent).toHaveBeenCalledWith(
      'evt_123',
      'checkout.session.completed',
      expect.anything(),
    );
    expect(shopSubscriptionRepository.acquireShopLock).toHaveBeenCalledWith(
      shopId,
      expect.anything(),
    );
    expect(checkoutSessionCompletedHandler.handle).toHaveBeenCalled();
    expect(result).toEqual({
      received: true,
      eventType: 'checkout.session.completed',
    });
  });

  it('returns duplicate for replayed stripe_event_id', async () => {
    webhookEventRepository.tryInsertEvent.mockResolvedValue(false);

    const result = await command.execute(payload, 'sig');

    expect(result.duplicate).toBe(true);
    expect(checkoutSessionCompletedHandler.handle).not.toHaveBeenCalled();
  });

  it('ignores events outside subscription domain', async () => {
    contextService.resolveShopId.mockResolvedValue(null);

    const result = await command.execute(payload, 'sig');

    expect(result.ignored).toBe(true);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
