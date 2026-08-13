import { Injectable, NotFoundException } from '@nestjs/common';
import type Stripe from 'stripe';
import { StripeClientService } from '@/libs/gateways/stripe/stripe-client.service';
import { bdtDecimalToStripeUnitAmount } from '@/libs/gateways/stripe/stripe-amount.util';
import {
  mapPlanIntervalToStripe,
  stripePriceMatchesPlan,
} from '../../infrastructure/stripe/stripe-plan.util';
import {
  toSubscriptionPlanResponse,
  type SubscriptionPlanResponse,
} from '../../mappers/subscription-plan.mapper';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';
import type { TSubscriptionPlan } from '@/_db/drizzle/schema/subscription/subscription-plans.schema';

@Injectable()
export class SyncPlanToStripeCommand {
  constructor(
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
    private readonly stripeClientService: StripeClientService,
  ) {}

  async execute(planId: string): Promise<SubscriptionPlanResponse> {
    const stripe = this.stripeClientService.requireConfigured();
    const plan = await this.subscriptionPlanRepository.findById(planId);

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    const productId = await this.ensureStripeProduct(stripe, plan);
    const syncedPlan = await this.ensureStripePrice(stripe, planId, plan, productId);

    return toSubscriptionPlanResponse(syncedPlan);
  }

  private async ensureStripeProduct(
    stripe: Stripe,
    plan: TSubscriptionPlan,
  ): Promise<string> {
    if (plan.stripeProductId) {
      return plan.stripeProductId;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description ?? undefined,
      metadata: {
        byteForgePlanId: plan.id,
        interval: plan.interval,
      },
    });

    const updated = await this.subscriptionPlanRepository.update(plan.id, {
      stripeProductId: product.id,
    });

    return updated?.stripeProductId ?? product.id;
  }

  private async ensureStripePrice(
    stripe: Stripe,
    planId: string,
    plan: TSubscriptionPlan,
    productId: string,
  ): Promise<TSubscriptionPlan> {
    if (plan.stripePriceId) {
      const existingPrice = await stripe.prices.retrieve(plan.stripePriceId);
      if (stripePriceMatchesPlan(existingPrice, plan)) {
        return plan;
      }

      await this.subscriptionPlanRepository.appendPreviousStripePriceId(
        planId,
        plan.stripePriceId,
      );

      if (existingPrice.active) {
        await stripe.prices.update(plan.stripePriceId, { active: false });
      }
    }

    const price = await stripe.prices.create({
      product: productId,
      currency: 'bdt',
      unit_amount: bdtDecimalToStripeUnitAmount(plan.priceBdt),
      recurring: {
        interval: mapPlanIntervalToStripe(plan.interval),
      },
      metadata: {
        byteForgePlanId: plan.id,
        interval: plan.interval,
      },
    });

    const updated = await this.subscriptionPlanRepository.update(planId, {
      stripePriceId: price.id,
    });

    if (!updated) {
      throw new NotFoundException('Subscription plan not found');
    }

    return updated;
  }
}
