import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderAcceptedTemplate = createStandardTransactionalTemplate(
  EmailTemplateId.ORDERS_ACCEPTED,
);
