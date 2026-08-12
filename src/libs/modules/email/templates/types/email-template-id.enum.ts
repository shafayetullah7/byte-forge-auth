export enum EmailTemplateId {
  AUTH_ACCOUNT_VERIFICATION = 'auth.account-verification',
  AUTH_PASSWORD_RESET = 'auth.password-reset',
  ORDERS_PLACED_BUYER = 'orders.placed-buyer',
  ORDERS_PLACED_SELLER = 'orders.placed-seller',
  ORDERS_ACCEPTED = 'orders.accepted',
  ORDERS_PACKED = 'orders.packed',
  ORDERS_SHIPPED = 'orders.shipped',
  ORDERS_DELIVERED = 'orders.delivered',
  ORDERS_DELIVERY_CONFIRMED_SELLER = 'orders.delivery-confirmed-seller',
  ORDERS_COMPLETED = 'orders.completed',
  ORDERS_CANCELLED_BY_BUYER = 'orders.cancelled-by-buyer',
  ORDERS_CANCELLED_BY_SELLER = 'orders.cancelled-by-seller',
  SHOP_VERIFICATION_SUBMITTED = 'shop.verification-submitted',
  SHOP_VERIFICATION_APPROVED = 'shop.verification-approved',
  SHOP_VERIFICATION_REJECTED = 'shop.verification-rejected',
}

/** Maps legacy transactional-email.service template keys to EmailTemplateId */
export const LEGACY_TRANSACTIONAL_TEMPLATE_KEY_MAP: Record<
  string,
  EmailTemplateId
> = {
  orderPlacedBuyer: EmailTemplateId.ORDERS_PLACED_BUYER,
  orderPlacedSeller: EmailTemplateId.ORDERS_PLACED_SELLER,
  orderAccepted: EmailTemplateId.ORDERS_ACCEPTED,
  orderPacked: EmailTemplateId.ORDERS_PACKED,
  orderShipped: EmailTemplateId.ORDERS_SHIPPED,
  orderDelivered: EmailTemplateId.ORDERS_DELIVERED,
  orderDeliveryConfirmedSeller:
    EmailTemplateId.ORDERS_DELIVERY_CONFIRMED_SELLER,
  orderCompleted: EmailTemplateId.ORDERS_COMPLETED,
  orderCancelledByBuyer: EmailTemplateId.ORDERS_CANCELLED_BY_BUYER,
  orderCancelledBySeller: EmailTemplateId.ORDERS_CANCELLED_BY_SELLER,
  shopVerificationSubmitted: EmailTemplateId.SHOP_VERIFICATION_SUBMITTED,
  shopVerificationApproved: EmailTemplateId.SHOP_VERIFICATION_APPROVED,
  shopVerificationRejected: EmailTemplateId.SHOP_VERIFICATION_REJECTED,
};
