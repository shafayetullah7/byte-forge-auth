import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { ShopRepository } from '@/modules/shop/repositories';
import { ShopVerificationRepository } from '@/_repositories/business/shop.verification.repository/shop.verification.repository';
import { ShopVerificationHistoryRepository } from '@/_repositories/business/shop.verification.history.repository/shop.verification.history.repository';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RejectShopDto } from './dto/reject-shop.dto';
import { ShopQueryDto } from './dto/shop-query.dto';
import { DeactivateShopDto } from './dto/deactivate-shop.dto';
import { SuspendShopDto } from './dto/suspend-shop.dto';
import { paginate } from '@/common/utils/pagination.util';
import { PaginationParams } from '@/common/schemas/pagination.schema';
import { and, eq, sql, asc, desc, ilike, count, inArray } from 'drizzle-orm';
import {
  shopTable,
  shopVerificationTable,
  shopVerificationHistoryTable,
} from '@/_db/drizzle/schema';
import {
  ShopStatusEnum,
  ShopVerificationStatusEnum,
  ShopVerificationActionEnum,
} from '@/_db/drizzle/enum';
import {
  NotificationEventNames,
  ShopVerificationDecidedEvent,
} from '@/common/modules/events/events';

@Injectable()
export class AdminShopService {
  constructor(
    private readonly db: DrizzleService,
    private readonly shopRepository: ShopRepository,
    private readonly shopVerificationRepository: ShopVerificationRepository,
    private readonly shopVerificationHistoryRepository: ShopVerificationHistoryRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPendingVerifications(query: PaginationParams) {
    const { limit = 20, page = 1 } = query;
    const offset = (page - 1) * limit;

    const whereClause = eq(
      shopVerificationTable.status,
      ShopVerificationStatusEnum.PENDING,
    );

    const [data, [{ total }]] = await Promise.all([
      this.db.client.query.shopVerificationTable.findMany({
        where: whereClause,
        with: {
          shop: {
            with: {
              translations: true,
            },
          },
        },
        limit,
        offset,
        orderBy: desc(shopVerificationTable.createdAt),
      }),
      this.db.client
        .select({ total: count() })
        .from(shopVerificationTable)
        .where(whereClause)
        .execute(),
    ]);

    return paginate(data, total, page, limit);
  }

  async approveShop(shopId: string) {
    const ownerId = await this.db.transaction(async (tx) => {
      const currentVerification = await this.shopVerificationRepository.findOne(
        { shopId },
        tx,
      );

      const verifications = await this.shopVerificationRepository.update(
        {
          status: ShopVerificationStatusEnum.APPROVED,
          verifiedAt: new Date(),
          rejectionReason: null,
          adminNotes: null,
        },
        { shopId },
        tx,
      );

      const verification = verifications[0];

      if (!verification) {
        throw new NotFoundException('Verification record not found');
      }

      await this.shopRepository.update(
        shopId,
        { status: ShopStatusEnum.ACTIVE, isVerified: true },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.APPROVED,
          previousStatus: currentVerification?.status,
          newStatus: ShopVerificationStatusEnum.APPROVED,
        },
        tx,
      );

      const shop = await this.shopRepository.getShopById(shopId, { tx });
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }
      return shop.ownerId;
    });

    this.eventEmitter.emit(
      NotificationEventNames.SHOP_VERIFICATION_DECIDED,
      new ShopVerificationDecidedEvent({
        shopId,
        ownerId,
        decision: 'approved',
      }),
    );

    return this.shopVerificationRepository.findOne({ shopId });
  }

  async rejectShop(shopId: string, dto: RejectShopDto) {
    const { ownerId, reason } = await this.db.transaction(async (tx) => {
      const currentVerification = await this.shopVerificationRepository.findOne(
        { shopId },
        tx,
      );

      const verifications = await this.shopVerificationRepository.update(
        {
          status: ShopVerificationStatusEnum.REJECTED,
          verifiedAt: null,
          rejectionReason: dto.reason,
          adminNotes: dto.adminNotes || null,
        },
        { shopId },
        tx,
      );

      const verification = verifications[0];

      if (!verification) {
        throw new NotFoundException('Verification record not found');
      }

      await this.shopRepository.update(
        shopId,
        { status: ShopStatusEnum.REJECTED, isVerified: false },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.REJECTED,
          previousStatus: currentVerification?.status,
          newStatus: ShopVerificationStatusEnum.REJECTED,
          reason: dto.reason,
          changes: dto.adminNotes ? { adminNotes: dto.adminNotes } : undefined,
        },
        tx,
      );

      const shop = await this.shopRepository.getShopById(shopId, { tx });
      if (!shop) {
        throw new NotFoundException('Shop not found');
      }
      return { ownerId: shop.ownerId, reason: dto.reason };
    });

    this.eventEmitter.emit(
      NotificationEventNames.SHOP_VERIFICATION_DECIDED,
      new ShopVerificationDecidedEvent({
        shopId,
        ownerId,
        decision: 'rejected',
        reason,
      }),
    );

    return this.shopVerificationRepository.findOne({ shopId });
  }

  async getAllShops(query: ShopQueryDto) {
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

  async getShopById(shopId: string) {
    const shop = await this.db.client.query.shopTable.findFirst({
      where: eq(shopTable.id, shopId),
      with: {
        owner: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            userName: true,
            avatar: true,
            emailVerified: true,
            createdAt: true,
          },
          with: {
            localAuth: {
              columns: {
                email: true,
              },
            },
          },
        },
        logo: true,
        banner: true,
        translations: true,
        shopContactTable: true,
        shopAddressTable: {
          with: {
            translations: true,
          },
        },
        shopVerificationTable: {
          columns: {
            status: true,
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const englishTranslation = shop.translations?.find(
      (t) => t.locale === 'en',
    );

    return {
      id: shop.id,
      name: englishTranslation?.name || shop.slug,
      slug: shop.slug,
      logo: shop.logo?.url || null,
      banner: shop.banner?.url || null,
      status: shop.status,
      isVerified: shop.isVerified,
      verificationStatus: shop.shopVerificationTable?.status || null,
      owner: shop.owner
        ? {
            id: shop.owner.id,
            firstName: shop.owner.firstName,
            lastName: shop.owner.lastName,
            userName: shop.owner.userName,
            avatar: shop.owner.avatar || null,
            email: shop.owner.localAuth?.email ?? null,
            emailVerified: shop.owner.emailVerified,
            memberSince: shop.owner.createdAt,
          }
        : null,
      translations: (shop.translations ?? []).map((t) => ({
        locale: t.locale,
        name: t.name,
        description: t.description,
        businessHours: t.businessHours,
        tagline: t.tagline,
        about: t.about,
        sellerStory: t.sellerStory,
        brandMission: t.brandMission,
      })),
      contact: shop.shopContactTable
        ? {
            businessEmail: shop.shopContactTable.businessEmail,
            phone: shop.shopContactTable.phone,
            alternativePhone: shop.shopContactTable.alternativePhone,
            whatsapp: shop.shopContactTable.whatsapp,
            telegram: shop.shopContactTable.telegram,
            facebook: shop.shopContactTable.facebook,
            instagram: shop.shopContactTable.instagram,
            x: shop.shopContactTable.x,
          }
        : null,
      address: shop.shopAddressTable
        ? {
            postalCode: shop.shopAddressTable.postalCode,
            latitude: shop.shopAddressTable.latitude,
            longitude: shop.shopAddressTable.longitude,
            googleMapsLink: shop.shopAddressTable.googleMapsLink,
            isVerified: shop.shopAddressTable.isVerified,
            translations: (shop.shopAddressTable.translations ?? []).map(
              (t) => ({
                locale: t.locale,
                country: t.country,
                division: t.division,
                district: t.district,
                street: t.street,
              }),
            ),
          }
        : null,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }

  async getShopVerification(shopId: string) {
    const [verification, history] = await Promise.all([
      this.db.client.query.shopVerificationTable.findFirst({
        where: eq(shopVerificationTable.shopId, shopId),
        with: {
          tradeLicenseMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
          tinMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
          utilityBillMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
        },
      }),
      this.db.client.query.shopVerificationHistoryTable.findMany({
        where: eq(shopVerificationHistoryTable.shopId, shopId),
        orderBy: desc(shopVerificationHistoryTable.createdAt),
      }),
    ]);

    if (!verification) {
      throw new NotFoundException('Shop verification record not found');
    }

    return {
      shopId: verification.shopId,
      status: verification.status,
      submittedAt: verification.createdAt,
      verifiedAt: verification.verifiedAt,

      // Documents - IDs
      tradeLicenseDocumentId: verification.tradeLicenseDocumentId,
      tinDocumentId: verification.tinDocumentId,
      utilityBillDocumentId: verification.utilityBillDocumentId,

      // Documents - Full media objects for preview
      tradeLicenseNumber: verification.tradeLicenseNumber,
      tradeLicenseDocument: verification.tradeLicenseMedia
        ? {
            id: verification.tradeLicenseMedia.id,
            url: verification.tradeLicenseMedia.url,
            name: verification.tradeLicenseMedia.fileName || 'Trade License',
          }
        : null,
      tinNumber: verification.tinNumber,
      tinDocument: verification.tinMedia
        ? {
            id: verification.tinMedia.id,
            url: verification.tinMedia.url,
            name: verification.tinMedia.fileName || 'TIN Certificate',
          }
        : null,
      utilityBillDocument: verification.utilityBillMedia
        ? {
            id: verification.utilityBillMedia.id,
            url: verification.utilityBillMedia.url,
            name: verification.utilityBillMedia.fileName || 'Utility Bill',
          }
        : null,

      // Admin
      adminNotes: verification.adminNotes,
      rejectionReason: verification.rejectionReason,

      // History
      history: history.map((h) => ({
        id: h.id,
        action: h.action,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        reason: h.reason,
        timestamp: h.createdAt,
      })),
    };
  }

  async getShopStats() {
    const [stats, verificationCount] = await Promise.all([
      this.db.client
        .select({
          totalShops: count(),
          pendingShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.PENDING_VERIFICATION} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          activeShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.ACTIVE} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          suspendedShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.SUSPENDED} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
          inactiveShops:
            sql<number>`SUM(CASE WHEN ${shopTable.status} = ${ShopStatusEnum.INACTIVE} THEN 1 ELSE 0 END)`.mapWith(
              Number,
            ),
        })
        .from(shopTable),
      this.db.client
        .select({ total: count() })
        .from(shopVerificationTable)
        .where(
          eq(shopVerificationTable.status, ShopVerificationStatusEnum.PENDING),
        ),
    ]);

    const stat = stats[0];

    return {
      totalShops: stat?.totalShops || 0,
      pendingShops: stat?.pendingShops || 0,
      activeShops: stat?.activeShops || 0,
      suspendedShops: stat?.suspendedShops || 0,
      inactiveShops: stat?.inactiveShops || 0,
      pendingVerifications: verificationCount[0]?.total || 0,
    };
  }

  async suspendShop(shopId: string, dto: SuspendShopDto) {
    const shop = await this.shopRepository.getShopById(shopId);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.status !== ShopStatusEnum.ACTIVE) {
      throw new BadRequestException('Only active shops can be suspended');
    }

    await this.db.transaction(async (tx) => {
      await this.shopRepository.update(
        shopId,
        {
          status: ShopStatusEnum.SUSPENDED,
          isVerified: false,
        },
        tx,
      );

      await this.shopVerificationRepository.update(
        { status: ShopVerificationStatusEnum.REJECTED },
        { shopId },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.SUSPENDED,
          previousStatus: shop.status,
          newStatus: ShopStatusEnum.SUSPENDED,
          reason: dto.reason,
        },
        tx,
      );
    });

    return { message: 'Shop suspended successfully' };
  }

  async deactivateShop(shopId: string, dto: DeactivateShopDto) {
    const shop = await this.shopRepository.getShopById(shopId);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.status === ShopStatusEnum.INACTIVE) {
      throw new BadRequestException('Shop is already deactivated');
    }

    await this.db.transaction(async (tx) => {
      await this.shopRepository.update(
        shopId,
        {
          status: ShopStatusEnum.INACTIVE,
          isVerified: false,
        },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.DEACTIVATED,
          previousStatus: shop.status,
          newStatus: ShopStatusEnum.INACTIVE,
          reason: dto.reason,
        },
        tx,
      );
    });

    return { message: 'Shop deactivated successfully' };
  }

  async reactivateShop(shopId: string) {
    const shop = await this.shopRepository.getShopById(shopId);

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (
      shop.status !== ShopStatusEnum.SUSPENDED &&
      shop.status !== ShopStatusEnum.INACTIVE
    ) {
      throw new BadRequestException(
        'Only suspended or deactivated shops can be reactivated',
      );
    }

    await this.db.transaction(async (tx) => {
      await this.shopRepository.update(
        shopId,
        { status: ShopStatusEnum.ACTIVE },
        tx,
      );

      await this.shopVerificationHistoryRepository.create(
        {
          shopId,
          action: ShopVerificationActionEnum.REACTIVATED,
          previousStatus: shop.status,
          newStatus: ShopStatusEnum.ACTIVE,
        },
        tx,
      );
    });

    return { message: 'Shop reactivated successfully' };
  }
}
