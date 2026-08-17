import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionIntervalEnum } from '@/_db/drizzle/enum/subscription-interval.enum';
import { StripeClientService } from '@/libs/gateways/stripe/stripe-client.service';
import { SubscriptionPlanRepository } from '../../../../repositories/subscription-plan.repository';
import { SyncPlanToStripeCommand } from '../../sync-plan-to-stripe.command';

describe('SyncPlanToStripeCommand', () => {
  const planId = 'plan-1';
  const basePlan = {
    id: planId,
    name: 'Monthly Seller',
    description: null,
    interval: SubscriptionIntervalEnum.MONTH,
    priceBdt: '499.00',
    isActiveForNew: true,
    isRetired: false,
    stripeProductId: null,
    stripePriceId: null,
    previousStripePriceIds: [],
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let repository: jest.Mocked<
    Pick<
      SubscriptionPlanRepository,
      'findById' | 'update' | 'appendPreviousStripePriceId'
    >
  >;
  let stripeClientService: { requireConfigured: jest.Mock };
  let stripe: {
    products: { create: jest.Mock };
    prices: { create: jest.Mock; retrieve: jest.Mock; update: jest.Mock };
  };
  let command: SyncPlanToStripeCommand;

  beforeEach(() => {
    stripe = {
      products: { create: jest.fn() },
      prices: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
      },
    };
    stripeClientService = {
      requireConfigured: jest.fn().mockReturnValue(stripe),
    };
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
      appendPreviousStripePriceId: jest.fn(),
    };
    command = new SyncPlanToStripeCommand(
      repository as unknown as SubscriptionPlanRepository,
      stripeClientService as unknown as StripeClientService,
    );
  });

  it('throws when Stripe is not configured', async () => {
    stripeClientService.requireConfigured.mockImplementation(() => {
      throw new BadRequestException('Stripe is not configured');
    });

    await expect(command.execute(planId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when plan is missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(command.execute(planId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates Stripe product and price on first sync', async () => {
    repository.findById.mockResolvedValue(basePlan);
    stripe.products.create.mockResolvedValue({ id: 'prod_1' });
    stripe.prices.create.mockResolvedValue({ id: 'price_1' });
    repository.update
      .mockResolvedValueOnce({ ...basePlan, stripeProductId: 'prod_1' })
      .mockResolvedValueOnce({
        ...basePlan,
        stripeProductId: 'prod_1',
        stripePriceId: 'price_1',
      });

    const result = await command.execute(planId);

    expect(stripe.products.create).toHaveBeenCalled();
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        product: 'prod_1',
        currency: 'bdt',
        unit_amount: 49900,
      }),
    );
    expect(result.stripeProductId).toBe('prod_1');
    expect(result.stripePriceId).toBe('price_1');
  });

  it('skips price creation when existing Stripe price still matches', async () => {
    repository.findById.mockResolvedValue({
      ...basePlan,
      stripeProductId: 'prod_1',
      stripePriceId: 'price_1',
    });
    stripe.prices.retrieve.mockResolvedValue({
      id: 'price_1',
      active: true,
      currency: 'bdt',
      unit_amount: 49900,
      recurring: { interval: 'month' },
    });

    const result = await command.execute(planId);

    expect(stripe.prices.create).not.toHaveBeenCalled();
    expect(result.stripePriceId).toBe('price_1');
  });

  it('creates a new price and archives the old one when amount changes', async () => {
    repository.findById.mockResolvedValue({
      ...basePlan,
      priceBdt: '599.00',
      stripeProductId: 'prod_1',
      stripePriceId: 'price_old',
    });
    stripe.prices.retrieve.mockResolvedValue({
      id: 'price_old',
      active: true,
      currency: 'bdt',
      unit_amount: 49900,
      recurring: { interval: 'month' },
    });
    stripe.prices.create.mockResolvedValue({ id: 'price_new' });
    repository.appendPreviousStripePriceId.mockResolvedValue({
      ...basePlan,
      previousStripePriceIds: ['price_old'],
    });
    repository.update.mockResolvedValue({
      ...basePlan,
      priceBdt: '599.00',
      stripeProductId: 'prod_1',
      stripePriceId: 'price_new',
      previousStripePriceIds: ['price_old'],
    });

    const result = await command.execute(planId);

    expect(repository.appendPreviousStripePriceId).toHaveBeenCalledWith(
      planId,
      'price_old',
    );
    expect(stripe.prices.update).toHaveBeenCalledWith('price_old', {
      active: false,
    });
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ unit_amount: 59900 }),
    );
    expect(result.stripePriceId).toBe('price_new');
  });
});
