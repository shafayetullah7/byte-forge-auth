import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { CatalogQueryService } from '@/modules/catalog/application/queries';
import type { TAuthorizedShop } from '@/libs/types';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { CheckSellerSubscriptionQuery } from '@/modules/subscription/application/queries/check-seller-subscription.query';
import { loadProductSummaries } from '../utils/load-product-summaries';
import {
  buildMapSellerOrderContext,
  mapSellerOrder,
} from '../../mappers/seller-orders.mapper';
import { OrderDomainError } from '../../domain/order.errors';
import type { SellerOrderWithRelations } from '../../repositories/order.repository.types';

/** Seller mappers live under `modules/order/mappers/`. */
export async function mapSellerOrderResponse(
  order: SellerOrderWithRelations,
  shop: TAuthorizedShop,
  lang: string,
  catalogQueryService: CatalogQueryService,
  checkSellerSubscription?: CheckSellerSubscriptionQuery,
) {
  const productSummaries = await loadProductSummaries(
    catalogQueryService,
    order.items.map((item) => item.productId),
    lang,
  );

  const context = buildMapSellerOrderContext(shop, lang);
  if (checkSellerSubscription) {
    context.subscriptionFulfillmentAllowed =
      await isSellerSubscriptionFulfillmentAllowed(
        checkSellerSubscription,
        shop.id,
      );
  }

  return mapSellerOrder(order, lang, context, productSummaries);
}

export async function isSellerSubscriptionFulfillmentAllowed(
  checkSellerSubscription: CheckSellerSubscriptionQuery,
  shopId: string,
): Promise<boolean> {
  if (!checkSellerSubscription.isEnforcementEnabled()) {
    return true;
  }

  const entitlement = await checkSellerSubscription.execute(shopId);
  return entitlement.active;
}

export async function assertSellerSubscriptionAllowsFulfillment(
  checkSellerSubscription: CheckSellerSubscriptionQuery,
  shopId: string,
  lang: string,
  i18n: I18nService,
): Promise<void> {
  if (!checkSellerSubscription.isEnforcementEnabled()) {
    return;
  }

  const entitlement = await checkSellerSubscription.execute(shopId);
  if (entitlement.active) {
    return;
  }

  throw new CustomException({
    message: i18n.t('message.error.subscriptionRequiredForFulfillment', {
      lang,
    }),
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: ErrorCode.SUBSCRIPTION_REQUIRED,
  });
}

export function rethrowOrderDomainError(error: unknown): never {
  if (error instanceof OrderDomainError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}

export function requireSellerOrderDetail(
  order: SellerOrderWithRelations | null | undefined,
  message: string,
): SellerOrderWithRelations {
  if (!order) {
    throw new NotFoundException(message);
  }
  return order;
}
