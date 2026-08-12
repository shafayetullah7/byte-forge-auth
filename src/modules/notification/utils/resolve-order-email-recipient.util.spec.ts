import { OrderStatusEnum } from '@/_db/drizzle/enum/order-status.enum';
import { OrderStatusChangedEvent } from '@/common/modules/events/events';
import {
  resolveOrderEmailRecipient,
  resolveOrderEmailTemplateKey,
} from './resolve-order-email-recipient.util';

describe('resolveOrderEmailRecipient', () => {
  const base = {
    orderId: 'order-1',
    orderNumber: 'BF-2026-01-0001',
    shopId: 'shop-1',
    buyerUserId: 'buyer-1',
    changedByUserId: 'seller-1',
    fromStatus: OrderStatusEnum.PENDING_PAYMENT,
  };

  it('notifies buyer when seller accepts', () => {
    const event = new OrderStatusChangedEvent({
      ...base,
      toStatus: OrderStatusEnum.PROCESSING,
    });
    expect(resolveOrderEmailRecipient(event.payload)).toBe('buyer');
    expect(resolveOrderEmailTemplateKey(event.payload)).toBe('orderAccepted');
  });

  it('notifies seller when buyer cancels', () => {
    const event = new OrderStatusChangedEvent({
      ...base,
      toStatus: OrderStatusEnum.CANCELLED,
      changedByUserId: 'buyer-1',
    });
    expect(resolveOrderEmailRecipient(event.payload)).toBe('seller');
    expect(resolveOrderEmailTemplateKey(event.payload)).toBe(
      'orderCancelledByBuyer',
    );
  });

  it('notifies seller when buyer confirms delivery', () => {
    const event = new OrderStatusChangedEvent({
      ...base,
      fromStatus: OrderStatusEnum.SHIPPED,
      toStatus: OrderStatusEnum.DELIVERED,
      changedByUserId: 'buyer-1',
    });
    expect(resolveOrderEmailRecipient(event.payload)).toBe('seller');
    expect(resolveOrderEmailTemplateKey(event.payload)).toBe(
      'orderDeliveryConfirmedSeller',
    );
  });
});
