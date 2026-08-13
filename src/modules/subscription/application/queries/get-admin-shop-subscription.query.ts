import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopTable } from '@/_db/drizzle/schema';
import {
  toAdminShopSubscriptionResponse,
  type AdminShopSubscriptionResponse,
} from '../../mappers/shop-subscription.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';
import { SubscriptionInvoiceRepository } from '../../repositories/subscription-invoice.repository';

const RECENT_INVOICE_LIMIT = 10;

@Injectable()
export class GetAdminShopSubscriptionQuery {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly subscriptionInvoiceRepository: SubscriptionInvoiceRepository,
  ) {}

  async execute(shopId: string): Promise<AdminShopSubscriptionResponse> {
    await this.assertShopExists(shopId);

    const [subscription, invoices] = await Promise.all([
      this.shopSubscriptionRepository.findByShopId(shopId),
      this.subscriptionInvoiceRepository.findByShopId({
        shopId,
        limit: RECENT_INVOICE_LIMIT,
      }),
    ]);

    return toAdminShopSubscriptionResponse(shopId, subscription, invoices);
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
