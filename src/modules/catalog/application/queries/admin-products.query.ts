import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '@/libs/utils/pagination.util';
import type { AdminProductsQueryDto } from '../../controllers/dto/admin-products-query.dto';
import {
  mapAdminProductDetail,
  mapAdminProductSummary,
} from '../../mappers/admin-product.mapper';
import { ProductAdminRepository } from '../../repositories/product-admin.repository';

@Injectable()
export class ListAdminProductsQuery {
  constructor(
    private readonly productAdminRepository: ProductAdminRepository,
  ) {}

  async execute(query: AdminProductsQueryDto, lang: string) {
    const { rows, total, page, limit } = await this.productAdminRepository.list(
      query,
      lang,
    );
    return paginate(
      rows.map((row) => mapAdminProductSummary(row)),
      total,
      page,
      limit,
    );
  }
}

@Injectable()
export class GetAdminProductByIdQuery {
  constructor(
    private readonly productAdminRepository: ProductAdminRepository,
  ) {}

  async execute(productId: string) {
    const product = await this.productAdminRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const enTranslation = product.translations?.find((t) => t.locale === 'en');
    const shopEnName = product.shop?.translations?.find(
      (t) => t.locale === 'en',
    )?.name;
    const baseVariant =
      product.variants?.find((v) => v.isBase) ?? product.variants?.[0];

    return mapAdminProductDetail({
      id: product.id,
      slug: product.slug,
      status: product.status,
      productType: product.productType,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      thumbnailUrl: product.thumbnail?.url ?? null,
      name: enTranslation?.name ?? product.slug,
      shortDescription: enTranslation?.shortDescription ?? null,
      description: enTranslation?.description ?? null,
      price: baseVariant?.price ?? null,
      availableQuantity: baseVariant?.availableQuantity ?? 0,
      stockStatus: baseVariant?.stockStatus ?? null,
      shopId: product.shopId,
      shopSlug: product.shop?.slug ?? '',
      shopName: shopEnName ?? product.shop?.slug ?? null,
      shopStatus: product.shop?.status ?? '',
      sku: baseVariant?.sku ?? null,
      translations: (product.translations ?? []).map((t) => ({
        locale: t.locale,
        name: t.name,
        shortDescription: t.shortDescription,
        description: t.description,
      })),
    });
  }
}
