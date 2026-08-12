import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderCancelledBySellerTemplate =
  createStandardTransactionalTemplate(
    EmailTemplateId.ORDERS_CANCELLED_BY_SELLER,
  );
