import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { SubscriptionInvoiceStatusEnum } from '@/_db/drizzle/enum/subscription-invoice-status.enum';
import { shopTable } from '@/_db/drizzle/schema';
import type { TShopSubscription } from '@/_db/drizzle/schema/subscription/shop-subscriptions.schema';
import {
  computeStatus,
  extendPeriod,
  SubscriptionDurationUnit,
  SubscriptionDomainError,
} from '../../domain';
import type { ExtendShopSubscriptionDto } from '../../controllers/dto/extend-shop-subscription.dto';
import {
  toAdminShopSubscriptionResponse,
  type AdminShopSubscriptionResponse,
} from '../../mappers/shop-subscription.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';

const RECENT_INVOICE_LIMIT = 10;

@Injectable()
export class ExtendShopSubscriptionCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
  ) {}

  async execute(
    shopId: string,
    dto: ExtendShopSubscriptionDto,
  ): Promise<AdminShopSubscriptionResponse> {
    await this.assertShopExists(shopId);

    const durationValue = dto.days ?? dto.months!;
    const durationUnit = dto.days
      ? SubscriptionDurationUnit.DAY
      : SubscriptionDurationUnit.MONTH;

    try {
      return await this.db.transaction(async (tx) => {
        await this.shopSubscriptionRepository.acquireShopLock(shopId, tx);

        const existing =
          await this.shopSubscriptionRepository.findByShopId(shopId, tx);
        const now = new Date();
        const previousEnd = existing?.currentPeriodEnd ?? null;
        const periodStart = new Date(
          Math.max(previousEnd?.getTime() ?? Number.NEGATIVE_INFINITY, now.getTime()),
        );
        const newPeriodEnd = extendPeriod(
          previousEnd,
          durationValue,
          durationUnit,
          now,
        );
        const status = computeStatus(newPeriodEnd, now);
        const billingProvider = resolveBillingProviderAfterAdminExtend(existing);

        const subscription = await this.shopSubscriptionRepository.upsertByShopId(
          shopId,
          {
            status,
            currentPeriodEnd: newPeriodEnd,
            billingProvider,
            planId: existing?.planId ?? null,
            stripeCustomerId: existing?.stripeCustomerId ?? null,
            stripeSubscriptionId: existing?.stripeSubscriptionId ?? null,
            cancelAtPeriodEnd: existing?.cancelAtPeriodEnd ?? false,
          },
          tx,
        );

        await this.subscriptionInvoiceRepository.create(
          {
            shopId,
            planId: existing?.planId ?? null,
            amountBdt: '0.00',
            currency: 'BDT',
            provider: SubscriptionBillingProviderEnum.ADMIN,
            status: SubscriptionInvoiceStatusEnum.PAID,
            periodStart,
            periodEnd: newPeriodEnd,
            paidAt: now,
            metadata: {
              reason: dto.reason,
              durationValue,
              durationUnit,
              source: 'admin_manual_extend',
            },
          },
          tx,
        );

        const invoices = await this.subscriptionInvoiceRepository.findByShopId(
          { shopId, limit: RECENT_INVOICE_LIMIT },
          tx,
        );

        return toAdminShopSubscriptionResponse(
          shopId,
          subscription,
          invoices,
          now,
        );
      });
    } catch (error) {
      if (error instanceof SubscriptionDomainError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async assertShopExists(shopId: string): Promise<void> {
    const [shop] = await this.db.client
      .select({ id: shopTable.id })
      .from(shopTable)
      .where(eq(shopTable.id, shopId))
      .limit(1)
      .execute();

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }
  }
}

function resolveBillingProviderAfterAdminExtend(
  existing: TShopSubscription | null,
): (typeof SubscriptionBillingProviderEnum)[keyof typeof SubscriptionBillingProviderEnum] {
  if (existing?.stripeSubscriptionId) {
    return SubscriptionBillingProviderEnum.STRIPE;
  }
  return SubscriptionBillingProviderEnum.ADMIN;
}
