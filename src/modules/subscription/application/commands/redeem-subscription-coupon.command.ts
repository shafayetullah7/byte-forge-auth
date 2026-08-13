import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import type { TSubscriptionDurationUnit } from '@/_db/drizzle/enum/subscription-duration-unit.enum';
import {
  assertCanRedeemCoupon,
  assertCouponDefinitionValid,
  computeStatus,
  extendPeriod,
  SubscriptionDomainError,
  SubscriptionDurationUnit,
} from '../../domain';
import type { RedeemSubscriptionCouponDto } from '../../controllers/dto/redeem-subscription-coupon.dto';
import {
  toSellerSubscriptionResponse,
  type SellerSubscriptionResponse,
} from '../../mappers/seller-subscription.mapper';
import { toSubscriptionPlanResponse } from '../../mappers/subscription-plan.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionCouponRepository } from '../../repositories/subscription-coupon.repository';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';
import { SubscriptionPlanRepository } from '../../repositories/subscription-plan.repository';

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: string }).code === '23505';

@Injectable()
export class RedeemSubscriptionCouponCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionCouponRepository: SubscriptionCouponRepository,
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async execute(
    shopId: string,
    dto: RedeemSubscriptionCouponDto,
  ): Promise<SellerSubscriptionResponse> {
    try {
      return await this.db.transaction(async (tx) => {
        await this.shopSubscriptionRepository.acquireShopLock(shopId, tx);

        const coupon = await this.subscriptionCouponRepository.findByCodeForUpdate(
          dto.code,
          tx,
        );
        if (!coupon) {
          throw new NotFoundException('Subscription coupon not found');
        }

        const existingSubscription =
          await this.shopSubscriptionRepository.findByShopId(shopId, tx);
        const now = new Date();

        assertCanRedeemCoupon(existingSubscription?.currentPeriodEnd ?? null, now);
        assertCouponDefinitionValid(coupon, now);

        const existingRedemption =
          await this.subscriptionCouponRepository.findRedemptionByShopAndCoupon(
            shopId,
            coupon.id,
            tx,
          );
        if (existingRedemption) {
          throw new ConflictException(
            'This coupon has already been redeemed for your shop',
          );
        }

        const incremented =
          await this.subscriptionCouponRepository.tryIncrementRedemptionCount(
            coupon.id,
            tx,
          );
        if (!incremented) {
          throw new ConflictException('Coupon redemption limit reached');
        }

        const previousEnd = existingSubscription?.currentPeriodEnd ?? null;
        const periodStart = new Date(
          Math.max(
            previousEnd?.getTime() ?? Number.NEGATIVE_INFINITY,
            now.getTime(),
          ),
        );
        const durationUnit = toSubscriptionDurationUnit(coupon.durationUnit);
        const newPeriodEnd = extendPeriod(
          previousEnd,
          coupon.durationValue,
          durationUnit,
          now,
        );
        const status = computeStatus(newPeriodEnd, now);

        const subscription = await this.shopSubscriptionRepository.upsertByShopId(
          shopId,
          {
            status,
            currentPeriodEnd: newPeriodEnd,
            billingProvider: resolveBillingProviderAfterCouponRedeem(
              existingSubscription,
            ),
            planId: existingSubscription?.planId ?? null,
            stripeCustomerId: existingSubscription?.stripeCustomerId ?? null,
            stripeSubscriptionId:
              existingSubscription?.stripeSubscriptionId ?? null,
            cancelAtPeriodEnd: existingSubscription?.cancelAtPeriodEnd ?? false,
          },
          tx,
        );

        await this.subscriptionCouponRepository.createRedemption(
          {
            couponId: coupon.id,
            shopId,
            periodEndAfter: newPeriodEnd,
          },
          tx,
        );

        await this.subscriptionInvoiceRepository.create(
          {
            shopId,
            planId: existingSubscription?.planId ?? null,
            amountBdt: '0.00',
            currency: 'BDT',
            provider: SubscriptionBillingProviderEnum.COUPON,
            status: SubscriptionInvoiceStatusEnum.PAID,
            periodStart,
            periodEnd: newPeriodEnd,
            paidAt: now,
            metadata: {
              couponId: coupon.id,
              couponCode: coupon.code,
              durationValue: coupon.durationValue,
              durationUnit: coupon.durationUnit,
              source: 'seller_coupon_redeem',
            },
          },
          tx,
        );

        const availablePlans = (
          await this.subscriptionPlanRepository.findAll(
            { activeForNewOnly: true },
            tx,
          )
        ).map(toSubscriptionPlanResponse);

        return toSellerSubscriptionResponse(subscription, availablePlans, now);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof SubscriptionDomainError) {
        if (error.message.includes('already active until')) {
          throw new ConflictException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This coupon has already been redeemed for your shop',
        );
      }
      throw error;
    }
  }
}

function toSubscriptionDurationUnit(
  unit: TSubscriptionDurationUnit,
): SubscriptionDurationUnit {
  if (unit === SubscriptionDurationUnit.DAY) {
    return SubscriptionDurationUnit.DAY;
  }
  if (unit === SubscriptionDurationUnit.MONTH) {
    return SubscriptionDurationUnit.MONTH;
  }
  throw new SubscriptionDomainError(`Unsupported duration unit: ${unit}`);
}

function resolveBillingProviderAfterCouponRedeem(
  existing: Awaited<
    ReturnType<ShopSubscriptionRepository['findByShopId']>
  >,
): (typeof SubscriptionBillingProviderEnum)[keyof typeof SubscriptionBillingProviderEnum] {
  if (existing?.stripeSubscriptionId) {
    return SubscriptionBillingProviderEnum.STRIPE;
  }
  return SubscriptionBillingProviderEnum.COUPON;
}
