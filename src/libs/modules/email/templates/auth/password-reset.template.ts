import { EmailTemplateId } from '../types/email-template-id.enum';
import { createOtpAuthTemplate } from '../base/template-builders';

export const passwordResetTemplate = createOtpAuthTemplate(
  EmailTemplateId.AUTH_PASSWORD_RESET,
);
