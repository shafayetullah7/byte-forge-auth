import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderDeliveryConfirmedSellerTemplate =
  createStandardTransactionalTemplate(
    EmailTemplateId.ORDERS_DELIVERY_CONFIRMED_SELLER,
  );
