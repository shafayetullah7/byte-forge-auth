import { Injectable, HttpStatus } from '@nestjs/common';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ListProductsService } from './services/list-products.service';
import { GetProductByIdService } from './services/get-product-by-id.service';
import { GetProductSummaryService } from './services/get-product-summary.service';
import { GetProductOverviewService } from './services/get-product-overview.service';
import { ShopRepository } from '@/modules/shop/repositories';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';

@Injectable()
export class ProductsService {
  constructor(
    private readonly listProductsService: ListProductsService,
    private readonly getProductByIdService: GetProductByIdService,
    private readonly getProductSummaryService: GetProductSummaryService,
    private readonly getProductOverviewService: GetProductOverviewService,
    private readonly shopRepository: ShopRepository,
    private readonly i18n: I18nService,
  ) {}

  async getProducts(userId: string, query: ListProductsQueryDto, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    return this.listProductsService.execute(shop.id, query, lang);
  }

  async getProductById(userId: string, productId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const product = await this.getProductByIdService.execute(
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

    return product;
  }

  async getProductSummary(userId: string, productId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const product = await this.getProductSummaryService.execute(
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

    return product;
  }

  async getProductOverview(userId: string, productId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const product = await this.getProductOverviewService.execute(
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

    return product;
  }

  private async resolveShop(userId: string, lang: string) {
    const shop = await this.shopRepository.getShopByOwnerId(userId);

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
