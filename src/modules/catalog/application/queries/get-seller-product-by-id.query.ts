import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  loadVariantInventorySettings,
  resolveVariantInventorySettings,
} from '@/libs/inventory/variant-inventory-settings.loader';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { ProductRepository } from '../../repositories/product.repository';
import {
  isVariantLowStock,
  mapVariantStockToApi,
} from '../../mappers/variant-stock.mapper';

export type SellerProductDetail = {
  id: string;
  slug: string;
  productType: string;
  status: string;
  thumbnail: { id: string; url: string } | null;
  translations: Array<{
    locale: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
  }>;
  variants: Array<{
    id: string;
    sku: string | null;
    price: string;
    inventoryCount: number;
    lowStockThreshold: number;
    isBase: boolean;
    isActive: boolean;
  }>;
  stockBreakdown: {
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    lowStockCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

type ProductRow = NonNullable<
  Awaited<ReturnType<ProductRepository['findDetailForShop']>>
>;

@Injectable()
export class GetSellerProductByIdQuery {
  private readonly logger = new Logger(GetSellerProductByIdQuery.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
    private readonly db: DrizzleService,
  ) {}

  async execute(
    userId: string,
    productId: string,
    lang: string,
  ): Promise<SellerProductDetail> {
    const shop = await this.resolveShop(userId, lang);
    try {
      const product = await this.productRepository.findDetailForShop(
        shop.id,
        productId,
      );
      if (!product) {
        throw new CustomException({
          message: this.i18n.t('message.error.productNotFound', { lang }),
          statusCode: HttpStatus.NOT_FOUND,
          errorCode: ErrorCode.NOT_FOUND,
        });
      }
      return this.mapResult(
        product,
        await loadVariantInventorySettings(
          this.db,
          product.variants.map((v) => v.id),
        ),
      );
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to fetch product ${productId} for shop ${shop.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private mapResult(
    product: ProductRow,
    inventorySettings: Awaited<ReturnType<typeof loadVariantInventorySettings>>,
  ): SellerProductDetail {
    const thumbnail = product.thumbnail
      ? { id: product.thumbnail.id, url: product.thumbnail.url }
      : null;

    const translations = product.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
    }));

    const variants = product.variants.map((v) => {
      const stock = mapVariantStockToApi(v.availableQuantity, v.stockStatus);
      const settings = resolveVariantInventorySettings(inventorySettings, v.id);
      return {
        id: v.id,
        sku: v.sku,
        price: v.price,
        inventoryCount: stock.inventoryCount,
        lowStockThreshold: settings.lowStockThreshold,
        isBase: v.isBase,
        isActive: v.isActive,
        _stockStatus: v.stockStatus,
      };
    });

    const totalStock = variants.reduce((sum, v) => sum + v.inventoryCount, 0);
    const lowStockCount = variants.filter((v) =>
      isVariantLowStock(v._stockStatus),
    ).length;

    return {
      id: product.id,
      slug: product.slug,
      productType: product.productType,
      status: product.status,
      thumbnail,
      translations,
      variants: variants.map(({ _stockStatus: _, ...variant }) => variant),
      stockBreakdown: {
        totalStock,
        availableStock: totalStock,
        reservedStock: 0,
        lowStockCount,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private async resolveShop(userId: string, lang: string) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);
    if (!shop) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }
    return shop;
  }
}
