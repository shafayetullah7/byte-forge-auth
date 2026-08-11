import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { OrderStatusEnum, PaymentStatusEnum } from '@/_db/drizzle/enum';
import {
  OrderCartIntegration,
  OrderUserAddressIntegration,
} from '@/common/integrations/order';
import { computeStockStatus } from '@/libs/cart/stock.util';
import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import {
  NotificationEventNames,
  OrderPlacedEvent,
} from '@/common/modules/events/events';
import { InventoryCommandService } from '@/modules/inventory/application/commands/inventory.command';
import { PaymentQueryService } from '@/modules/payment/application/queries';
import { OrderRepository } from '../../repositories/order.repository';
import type {
  PlaceOrderItem,
  PlaceOrderParams,
  PlaceOrderResult,
} from './place-order.command.types';

/**
 * Checkout orchestration. Cross-module cart/address/payment access goes through
 * `@/common/integrations/order` until Cart/Address modules are fully decoupled.
 */
@Injectable()
export class PlaceOrderCommand {
  constructor(
    private readonly cartIntegration: OrderCartIntegration,
    private readonly addressIntegration: OrderUserAddressIntegration,
    private readonly orderRepository: OrderRepository,
    private readonly db: DrizzleService,
    private readonly paymentQueryService: PaymentQueryService,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    const lang = params.lang ?? 'en';

    const catalogMethod =
      await this.paymentQueryService.resolveActivePaymentMethod(
        params.paymentMethod,
      );

    const address = await this.addressIntegration.findById(params.addressId);
    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (address.userId !== params.userId) {
      throw new BadRequestException('This address does not belong to you');
    }

    const cart = await this.cartIntegration.getCartWithItemsAndShopById(
      params.cartId,
    );
    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const itemIdSet = new Set(params.itemIds);
    const selectedItems = cart.items.filter((item) => itemIdSet.has(item.id));

    if (selectedItems.length === 0) {
      throw new BadRequestException('No valid items selected for order');
    }

    const variantIds = selectedItems.map((item) => item.variantId);
    const inventories =
      await this.cartIntegration.getInventoryByVariantIds(variantIds);
    const inventoryMap = new Map(
      inventories.map((inv) => [inv.variantId, inv]),
    );

    const items: PlaceOrderItem[] = selectedItems.map((item) => {
      const variant = item.variant;
      const product = variant?.product;
      const shop = product?.shop;
      const translation = product?.translations?.find((t) => t.locale === lang);
      const variantTranslation = variant?.translations?.find(
        (t) => t.locale === lang,
      );
      const shopTranslation = resolveTranslation(
        shop?.translations ?? null,
        lang,
      );

      return {
        id: item.id,
        variantId: item.variantId,
        productId: product?.id ?? '',
        quantity: item.quantity,
        price: variant?.price ?? '0.00',
        productName: translation?.name ?? 'Unknown Product',
        productSlug: product?.slug ?? '',
        shopId: product?.shopId ?? '',
        shopName: shopTranslation?.name ?? 'Unknown Shop',
        variantTitle: variantTranslation?.title ?? undefined,
        sku: variant?.sku ?? undefined,
      };
    });

    const stockCheckErrors: string[] = [];
    for (const item of items) {
      const inventory = inventoryMap.get(item.variantId) ?? null;
      const stockInfo = computeStockStatus(inventory);

      if (stockInfo.stockStatus === 'out_of_stock') {
        stockCheckErrors.push(`${item.productName} is out of stock`);
      } else if (
        stockInfo.stockStatus === 'low_stock' &&
        stockInfo.availableQuantity !== null &&
        stockInfo.availableQuantity < item.quantity
      ) {
        stockCheckErrors.push(
          `Insufficient stock for ${item.productName}. Available: ${stockInfo.availableQuantity}, Requested: ${item.quantity}`,
        );
      }
    }

    if (stockCheckErrors.length > 0) {
      throw new BadRequestException(stockCheckErrors);
    }

    const shopGroups = new Map<string, PlaceOrderItem[]>();
    for (const item of items) {
      const existing = shopGroups.get(item.shopId) || [];
      existing.push(item);
      shopGroups.set(item.shopId, existing);
    }

    const districtId = address.districtId;
    const shopIds = Array.from(shopGroups.keys());

    const shippingRates =
      await this.orderRepository.getShopShippingRatesForDistrict(
        shopIds,
        districtId,
      );

    const rateMap = new Map<string, string>();
    for (const rate of shippingRates) {
      rateMap.set(rate.shopId, rate.cost);
    }

    const districtName = await this.orderRepository.getDistrictTranslatedName(
      districtId,
      lang,
    );

    const result = await this.db.transaction(async (tx) => {
      let groupTotal = 0;
      const orderResults: PlaceOrderResult['orders'] = [];
      const orderNumbers: string[] = [];

      const orderGroup = await this.orderRepository.createOrderGroup(
        {
          userId: params.userId,
          totalAmount: '0',
        },
        { tx },
      );

      for (const [shopId, shopItems] of shopGroups) {
        const itemsSubtotal = shopItems.reduce(
          (sum, item) => sum + parseFloat(item.price) * item.quantity,
          0,
        );
        const shippingCost = parseFloat(rateMap.get(shopId) ?? '0');
        const tax = 0;
        const shopTotal = itemsSubtotal + shippingCost + tax;

        groupTotal += shopTotal;

        const orderNumber = await this.orderRepository.nextOrderNumber({ tx });

        const order = await this.orderRepository.createOrder(
          {
            orderNumber,
            userId: params.userId,
            shopId,
            groupId: orderGroup.id,
            status: OrderStatusEnum.PENDING_PAYMENT,
            subtotal: itemsSubtotal.toFixed(2),
            shippingCost: shippingCost.toFixed(2),
            tax: tax.toFixed(2),
            total: shopTotal.toFixed(2),
            paymentStatus: PaymentStatusEnum.PENDING,
            paymentMethod: catalogMethod.key,
            paymentMethodId: catalogMethod.id,
            notes: params.notes ?? null,
          },
          { tx },
        );

        orderNumbers.push(order.orderNumber);

        const orderItemsData = shopItems.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName,
          variantTitle: item.variantTitle ?? null,
          sku: item.sku ?? null,
          unitPrice: item.price,
          quantity: item.quantity,
          subtotal: (parseFloat(item.price) * item.quantity).toFixed(2),
        }));

        await this.orderRepository.createOrderItems(orderItemsData, { tx });

        await this.inventoryCommandService.reserveForOrder(
          shopItems.map((item) => ({
            variantId: item.variantId,
            shopId: item.shopId,
            quantity: item.quantity,
            productName: item.productName,
          })),
          order.id,
          params.userId,
          tx,
        );

        await this.orderRepository.createOrderAddress(
          {
            orderId: order.id,
            recipientName: address.recipientName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 ?? null,
            city: districtName,
            state: null,
            postalCode: address.postalCode ?? null,
            country: address.country,
            companyName: address.companyName ?? null,
            deliveryInstructions: address.deliveryInstructions ?? null,
          },
          { tx },
        );

        await this.orderRepository.createOrderStatusHistory(
          {
            orderId: order.id,
            fromStatus: null,
            toStatus: OrderStatusEnum.PENDING_PAYMENT,
            notes: `Order placed with ${catalogMethod.displayName}`,
            changedBy: params.userId,
          },
          { tx },
        );

        orderResults.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          shopId,
          shopName: shopItems[0].shopName,
          total: shopTotal.toFixed(2),
          itemCount: shopItems.length,
        });
      }

      await this.orderRepository.updateOrderGroup(
        orderGroup.id,
        { totalAmount: groupTotal.toFixed(2) },
        { tx },
      );

      await this.cartIntegration.removeOrderedItems(params.itemIds, { tx });

      return {
        orderGroupId: orderGroup.id,
        orderNumbers,
        totalAmount: groupTotal.toFixed(2),
        orders: orderResults,
      };
    });

    this.eventEmitter.emit(
      NotificationEventNames.ORDER_PLACED,
      new OrderPlacedEvent({
        orderGroupId: result.orderGroupId,
        buyerUserId: params.userId,
        totalAmount: result.totalAmount,
        orders: result.orders.map((o) => ({
          orderId: o.orderId,
          orderNumber: o.orderNumber,
          shopId: o.shopId,
          shopName: o.shopName,
          total: o.total,
        })),
      }),
    );

    return result;
  }
}
