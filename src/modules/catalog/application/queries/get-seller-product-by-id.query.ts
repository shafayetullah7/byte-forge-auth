import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { ProductRepository } from '../../repositories/product.repository';

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
      return this.mapResult(product);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to fetch product ${productId} for shop ${shop.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private mapResult(product: ProductRow): SellerProductDetail {
    const thumbnail = product.thumbnail
      ? { id: product.thumbnail.id, url: product.thumbnail.url }
      : null;

    const translations = product.translations.map((t) => ({
      locale: t.locale,
      name: t.name,
      description: t.description,
      shortDescription: t.shortDescription,
    }));

    const variants = product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      inventoryCount: v.inventoryCount ?? 0,
      lowStockThreshold: v.lowStockThreshold ?? 5,
      isBase: v.isBase,
      isActive: v.isActive,
    }));

    const totalStock = variants.reduce((sum, v) => sum + v.inventoryCount, 0);
    const lowStockCount = variants.filter(
      (v) => v.inventoryCount > 0 && v.inventoryCount <= v.lowStockThreshold,
    ).length;

    return {
      id: product.id,
      slug: product.slug,
      productType: product.productType,
      status: product.status,
      thumbnail,
      translations,
      variants,
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
