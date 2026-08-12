import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderDeliveredTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_DELIVERED,
);
