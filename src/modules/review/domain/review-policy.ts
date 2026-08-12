import { OrderStatusEnum, type TOrderStatus } from '@/_db/drizzle/enum';

export const REVIEWABLE_ORDER_STATUSES: TOrderStatus[] = [
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.COMPLETED,
];
