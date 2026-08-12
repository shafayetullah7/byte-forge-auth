import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const orderCancelledByBuyerTemplate =
  createStandardTransactionalTemplate(
    EmailTemplateId.ORDERS_CANCELLED_BY_BUYER,
  );
