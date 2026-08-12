import { EmailTemplateId } from '../types/email-template-id.enum';
import { createStandardTransactionalTemplate } from '../base/template-builders';

export const shopVerificationSubmittedTemplate =
  createStandardTransactionalTemplate(
    EmailTemplateId.SHOP_VERIFICATION_SUBMITTED,
  );
