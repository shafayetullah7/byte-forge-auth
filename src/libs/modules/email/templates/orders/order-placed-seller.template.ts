import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderPlacedSellerTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_PLACED_SELLER,
);
