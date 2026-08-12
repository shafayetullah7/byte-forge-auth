import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderPlacedBuyerTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_PLACED_BUYER,
);
