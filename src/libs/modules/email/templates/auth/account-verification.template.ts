import { EmailTemplateId } from '../types/email-template-id.enum';
import { createOtpAuthTemplate } from '../base/template-builders';

export const accountVerificationTemplate = createOtpAuthTemplate(
  EmailTemplateId.AUTH_ACCOUNT_VERIFICATION,
);
