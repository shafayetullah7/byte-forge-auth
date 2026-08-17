import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import { userTable } from '@/_db/drizzle/schema/user/user.schema';
import {
  assertCanRedeemCoupon,
  SubscriptionDomainError,
} from '../../domain';
import type { CreateSellerSubscriptionCheckoutDto } from '../../controllers/dto/create-seller-subscription-checkout.dto';
import { StripeSubscriptionProvider } from '../../infrastructure/providers/stripe-subscription.provider';
import {
  toSellerSubscriptionCheckoutResponse,
  type SellerSubscriptionCheckoutResponse,
} from '../../mappers/seller-subscription-checkout.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';
import type { TSubscriptionPlan } from '@/_db/drizzle/schema/subscription/subscription-plans.schema';
import type { TSubscriptionInvoice } from '@/_db/drizzle/schema/subscription/subscription-invoices.schema';
import type { DrizzleTx } from '@/libs/db/types';

const CHECKOUT_IDEMPOTENCY_WINDOW_MS = 30 * 60 * 1000;
const INCOMPLETE_STRIPE_SUBSCRIPTION_STATUSES = new Set([
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
]);

@Injectable()
export class CreateSellerSubscriptionCheckoutCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
    private readonly stripeSubscriptionProvider: StripeSubscriptionProvider,
  ) {}

  async execute(
    shopId: string,
    userId: string,
    dto: CreateSellerSubscriptionCheckoutDto,
  ): Promise<SellerSubscriptionCheckoutResponse> {
    const plan = await this.subscriptionPlanRepository.findById(dto.planId);
    this.assertPlanAvailableForCheckout(plan, dto.planId);

    const sellerEmail = await this.resolveSellerEmail(userId);

    try {
      return await this.db.transaction(async (tx) => {
        await this.shopSubscriptionRepository.acquireShopLock(shopId, tx);

        const existingSubscription =
          await this.shopSubscriptionRepository.findByShopId(shopId, tx);
        const now = new Date();

        assertCanRedeemCoupon(
          existingSubscription?.currentPeriodEnd ?? null,
          now,
        );

        await this.assertNoIncompleteStripeSubscription(existingSubscription);

        const reusableCheckout = await this.resolveReusableCheckoutSession(
          shopId,
          dto.planId,
          now,
          tx,
        );
        if (reusableCheckout) {
          return toSellerSubscriptionCheckoutResponse(reusableCheckout);
        }

        const checkout =
          await this.stripeSubscriptionProvider.createSubscriptionCheckoutSession(
            {
              shopId,
              planId: plan!.id,
              stripePriceId: plan!.stripePriceId!,
              stripeCustomerId: existingSubscription?.stripeCustomerId ?? null,
              customerEmail: sellerEmail,
            },
          );

        await this.subscriptionInvoiceRepository.create(
          {
            shopId,
            planId: plan!.id,
            amountBdt: plan!.priceBdt,
            currency: 'BDT',
            provider: SubscriptionBillingProviderEnum.STRIPE,
            status: SubscriptionInvoiceStatusEnum.PENDING,
            externalId: checkout.sessionId,
            metadata: {
              checkoutSessionId: checkout.sessionId,
              planId: plan!.id,
              checkoutStatus: 'open',
              source: 'seller_stripe_checkout',
            },
          },
          tx,
        );

        return toSellerSubscriptionCheckoutResponse(checkout);
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      if (error instanceof SubscriptionDomainError) {
        if (error.message.includes('already active until')) {
          throw new ConflictException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private assertPlanAvailableForCheckout(
    plan: TSubscriptionPlan | null,
    planId: string,
  ): void {
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!plan.isActiveForNew || plan.isRetired) {
      throw new BadRequestException(
        'Subscription plan is not available for new purchases',
      );
    }

    if (!plan.stripePriceId) {
      throw new BadRequestException(
        `Subscription plan '${planId}' is not synced to Stripe yet`,
      );
    }
  }

  private async resolveSellerEmail(userId: string): Promise<string | null> {
    const [row] = await this.db.client
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)
      .execute();

    return row?.email ?? null;
  }

  private async assertNoIncompleteStripeSubscription(
    existing: Awaited<
      ReturnType<ShopSubscriptionRepository['findByShopId']>
    >,
  ): Promise<void> {
    if (!existing?.stripeSubscriptionId) {
      return;
    }

    const subscription = await this.stripeSubscriptionProvider.retrieveSubscription(
      existing.stripeSubscriptionId,
    );

    if (INCOMPLETE_STRIPE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      throw new ConflictException(
        'Shop already has an incomplete Stripe subscription. Complete or cancel it before starting a new checkout.',
      );
    }
  }

  private async resolveReusableCheckoutSession(
    shopId: string,
    planId: string,
    now: Date,
    tx: DrizzleTx,
  ): Promise<{ url: string; sessionId: string } | null> {
    const pending =
      await this.subscriptionInvoiceRepository.findLatestPendingStripeCheckout(
        shopId,
        tx,
      );

    if (!pending?.externalId) {
      return null;
    }

    if (!this.isWithinCheckoutWindow(pending, now)) {
      return null;
    }

    const pendingPlanId = extractMetadataString(pending, 'planId');
    const session =
      await this.stripeSubscriptionProvider.retrieveCheckoutSession(
        pending.externalId,
      );

    if (session.status !== 'open' || !session.url) {
      return null;
    }

    if (pendingPlanId && pendingPlanId !== planId) {
      throw new ConflictException(
        'A Stripe checkout is already in progress for another plan. Complete or cancel it first.',
      );
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  private isWithinCheckoutWindow(
    invoice: TSubscriptionInvoice,
    now: Date,
  ): boolean {
    return (
      now.getTime() - invoice.createdAt.getTime() <=
      CHECKOUT_IDEMPOTENCY_WINDOW_MS
    );
  }
}

function extractMetadataString(
  invoice: TSubscriptionInvoice,
  key: string,
): string | null {
  const value = invoice.metadata?.[key];
  return typeof value === 'string' ? value : null;
}
