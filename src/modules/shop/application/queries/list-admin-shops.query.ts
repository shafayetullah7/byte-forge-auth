import { Injectable } from '@nestjs/common';
import { and, eq, sql, asc, desc, ilike, inArray } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopTable, shopVerificationTable } from '@/_db/drizzle/schema';
import { paginate } from '@/libs/utils/pagination.util';
import type { AdminShopQueryDto } from '../../controllers/dto/admin-shop-query.dto';

@Injectable()
export class ListAdminShopsQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute(query: AdminShopQueryDto) {
    const {
      status,
      verificationStatus,
      search,
      limit = 20,
      page = 1,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    const sortFn = sortOrder === 'asc' ? asc : desc;
    const sortByField =
      sortBy === 'updatedAt' ? shopTable.updatedAt : shopTable.createdAt;

    const baseConditions = [
      status ? eq(shopTable.status, status) : undefined,
      search ? ilike(shopTable.slug, `%${search}%`) : undefined,
    ];

    const verificationFilter = verificationStatus
      ? inArray(
          shopTable.id,
          this.db.client
            .select({ shopId: shopVerificationTable.shopId })
            .from(shopVerificationTable)
            .where(eq(shopVerificationTable.status, verificationStatus)),
        )
      : undefined;

    const where = and(...baseConditions, verificationFilter);

    const [data, [{ total }]] = await Promise.all([
      this.db.client.query.shopTable.findMany({
        where,
        orderBy: [sortFn(sortByField)],
        limit,
        offset,
        with: {
          owner: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              userName: true,
              avatar: true,
            },
          },
          logo: true,
          translations: true,
          shopAddressTable: {
            with: {
              translations: true,
            },
          },
          shopVerificationTable: {
            columns: {
              id: true,
              shopId: true,
              status: true,
              verifiedAt: true,
              rejectionReason: true,
            },
          },
        },
      }),
      this.db.client
        .select({ total: sql`count(*)`.mapWith(Number) })
        .from(shopTable)
        .where(where)
        .execute(),
    ]);

    const transformedData = data.map((shop) => {
      const englishTranslation = shop.translations?.find(
        (t) => t.locale === 'en',
      );
      const addressEnglishTranslation =
        shop.shopAddressTable?.translations?.find((t) => t.locale === 'en');
      return {
        id: shop.id,
        ownerId: shop.ownerId,
        slug: shop.slug,
        status: shop.status,
        isVerified: shop.isVerified,
        nameEn: englishTranslation?.name || shop.slug,
        division: addressEnglishTranslation?.division || null,
        city: addressEnglishTranslation?.district || null,
        logoId: shop.logoId,
        logoUrl: shop.logo?.url || null,
        owner: shop.owner
          ? {
              firstName: shop.owner.firstName,
              lastName: shop.owner.lastName,
              userName: shop.owner.userName,
              avatar: shop.owner.avatar || null,
            }
          : null,
        verification: shop.shopVerificationTable
          ? {
              status: shop.shopVerificationTable.status,
              verifiedAt: shop.shopVerificationTable.verifiedAt || null,
              rejectionReason:
                shop.shopVerificationTable.rejectionReason || null,
            }
          : null,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
      };
    });

    return paginate(transformedData, total, page, limit);
  }
}
