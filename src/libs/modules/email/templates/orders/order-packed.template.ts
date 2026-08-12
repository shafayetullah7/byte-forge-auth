import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderPackedTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_PACKED,
);
