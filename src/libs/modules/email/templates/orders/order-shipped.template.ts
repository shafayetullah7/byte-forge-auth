import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderShippedTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_SHIPPED,
);
