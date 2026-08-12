import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopShippingRatesTable } from '@/_db/drizzle/schema';
import { resolveTranslation } from '@/libs/utils/resolve-translation.util';

export type ShippingRateResponse = {
  districtId: string;
  districtName: string;
  divisionName: string;
  cost: string;
  costPerKg: string;
};

@Injectable()
export class GetShippingRatesQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute(
    shopId: string,
    lang: string = 'en',
  ): Promise<ShippingRateResponse[]> {
    const districts = await this.db.client.query.districtsTable.findMany({
      with: {
        translations: true,
        division: {
          with: {
            translations: true,
          },
        },
      },
      orderBy: (t, { asc }) => asc(t.sortOrder),
    });

    const rates = await this.db.client.query.shopShippingRatesTable.findMany({
      where: and(eq(shopShippingRatesTable.shopId, shopId)),
    });

    const rateMap = new Map<string, { cost: string; costPerKg: string }>();
    for (const rate of rates) {
      rateMap.set(rate.districtId, {
        cost: rate.cost,
        costPerKg: rate.costPerKg,
      });
    }

    return districts.map((district) => {
      const districtTranslation = resolveTranslation(
        district.translations,
        lang,
      );
      const divisionTranslation = resolveTranslation(
        district.division.translations,
        lang,
      );
      const rate = rateMap.get(district.id);

      return {
        districtId: district.id,
        districtName: districtTranslation?.name ?? 'Unnamed District',
        divisionName: divisionTranslation?.name ?? 'Unnamed Division',
        cost: rate?.cost ?? '0',
        costPerKg: rate?.costPerKg ?? '0',
      };
    });
  }
}
