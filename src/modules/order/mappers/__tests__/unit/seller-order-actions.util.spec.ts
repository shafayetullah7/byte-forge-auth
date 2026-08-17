import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';
import { ShopStatusEnum } from '@/_db/drizzle/enum/shop.status.enum';
import { buildSellerActionDescriptors } from '../../seller-order-actions.util';

describe('buildSellerActionDescriptors subscription gate', () => {
  it('keeps cancel actions enabled when subscription fulfillment is blocked', () => {
    const actions = buildSellerActionDescriptors({
      status: OrderStatusEnum.PROCESSING,
      paymentMethod: PaymentMethodEnum.COD,
      shipment: null,
      shopStatus: ShopStatusEnum.ACTIVE,
      subscriptionFulfillmentAllowed: false,
    });

    const cancel = actions.find((action) => action.key === 'CANCEL');
    const markPacked = actions.find((action) => action.key === 'MARK_PACKED');

    expect(cancel?.disabled).toBe(false);
    expect(markPacked?.disabled).toBe(true);
    expect(markPacked?.disabledReason).toContain('subscription');
  });

  it('allows fulfillment actions when subscription is active', () => {
    const actions = buildSellerActionDescriptors({
      status: OrderStatusEnum.CONFIRMED,
      paymentMethod: PaymentMethodEnum.COD,
      shipment: null,
      shopStatus: ShopStatusEnum.ACTIVE,
      subscriptionFulfillmentAllowed: true,
    });

    const ship = actions.find((action) => action.key === 'SHIP');
    expect(ship?.disabled).toBe(false);
  });
});
