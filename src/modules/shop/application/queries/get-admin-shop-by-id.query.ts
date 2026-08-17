import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { shopTable } from '@/_db/drizzle/schema';

@Injectable()
export class GetAdminShopByIdQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute(shopId: string) {
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
            email: true,
            emailVerified: true,
            createdAt: true,
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
            email: shop.owner.email ?? null,
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
}
