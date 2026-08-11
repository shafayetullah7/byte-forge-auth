import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopShippingRatesRepository } from '../../repositories/shop-shipping-rates.repository';

export type BulkShippingRateItem = {
  districtId: string;
  cost: string;
  costPerKg?: string;
};

export type ShippingRate = {
  id: string;
  shopId: string;
  districtId: string;
  cost: string;
  costPerKg: string;
};

@Injectable()
export class BulkUpdateShippingRatesCommand {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopShippingRatesRepository: ShopShippingRatesRepository,
  ) {}

  async execute(
    shopId: string,
    rates: BulkShippingRateItem[],
  ): Promise<ShippingRate[]> {
    return this.db.transaction(async (tx) => {
      const updated = await this.shopShippingRatesRepository.upsertBulk(
        shopId,
        rates,
        tx,
      );

      return updated.map((r) => ({
        id: r.id,
        shopId: r.shopId,
        districtId: r.districtId,
        cost: r.cost,
        costPerKg: r.costPerKg,
      }));
    });
  }
}
