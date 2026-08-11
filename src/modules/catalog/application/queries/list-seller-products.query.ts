import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { paginate } from '@/common/utils/pagination.util';
import { ShopQueryService } from '@/modules/shop/application/queries';
import type { ListProductsQueryDto } from '../../controllers/dto/list-products-query.dto';
import { ProductRepository } from '../../repositories/product.repository';

export type SellerProductListItem = {
  id: string;
  slug: string;
  productType: string;
  status: string;
  thumbnail: { id: string; url: string } | null;
  name: string | null;
  shortDescription: string | null;
  price: string | null;
  inventoryCount: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ListSellerProductsQuery {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async execute(userId: string, query: ListProductsQueryDto, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const { rows, total } = await this.productRepository.listForShop(
      shop.id,
      query,
      lang,
    );

    const data: SellerProductListItem[] = rows.map((row) => ({
      id: row.productId,
      slug: row.slug,
      productType: row.productType,
      status: row.status,
      thumbnail:
        row.thumbnailId && row.thumbnailUrl
          ? { id: row.thumbnailId, url: row.thumbnailUrl }
          : null,
      name: row.name ?? null,
      shortDescription: row.shortDescription ?? null,
      price: row.price ?? null,
      inventoryCount: row.inventoryCount ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return paginate(data, total, query.page, query.limit);
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
