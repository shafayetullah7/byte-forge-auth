import { EmailTemplateId } from '../types/email-template-id.enum';
import { createOtpAuthTemplate } from '../base/template-builders';

export const adminRegistrationOtpTemplate = createOtpAuthTemplate(
  EmailTemplateId.AUTH_ADMIN_REGISTRATION_OTP,
);
