import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { ProductRepository } from '../../repositories/product.repository';

export type SellerProductSummary = {
  id: string;
  slug: string;
  productType: string;
  status: string;
  name: string;
  shortDescription: string | null;
};

type SummaryRow = NonNullable<
  Awaited<ReturnType<ProductRepository['findSummaryForShop']>>
>;

@Injectable()
export class GetSellerProductSummaryQuery {
  private readonly logger = new Logger(GetSellerProductSummaryQuery.name);

  constructor(
    private readonly productRepository: ProductRepository,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    userId: string,
    productId: string,
    lang: string,
  ): Promise<SellerProductSummary> {
    const shop = await this.resolveShop(userId, lang);
    try {
      const product = await this.productRepository.findSummaryForShop(
        shop.id,
        productId,
        lang,
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
        `Failed to fetch product summary ${productId} for shop ${shop.id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private mapResult(product: SummaryRow): SellerProductSummary {
    const translation = product.translations[0] ?? {
      name: '',
      shortDescription: null,
    };
    return {
      id: product.id,
      slug: product.slug,
      productType: product.productType,
      status: product.status,
      name: translation.name,
      shortDescription: translation.shortDescription,
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
