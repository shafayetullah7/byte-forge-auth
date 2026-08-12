import { Injectable } from '@nestjs/common';
import { EmailCopyService } from '../services/email-copy.service';
import { EmailTemplateId } from '../templates/types/email-template-id.enum';
import type {
  EmailRenderArgs,
  RenderedEmail,
} from '../templates/types/email-template.types';
import { emailTemplateRegistry } from '../templates/registry/email-template.registry';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly emailCopyService: EmailCopyService) {}

  render(templateId: EmailTemplateId, args: EmailRenderArgs): RenderedEmail {
    const template = emailTemplateRegistry.get(templateId);
    if (!template) {
      throw new Error(`Unknown email template: ${templateId}`);
    }

    const copy = this.emailCopyService.load(templateId);
    this.emailCopyService.validateBilingualCopy(copy);

    const sharedCopy = this.emailCopyService.loadShared();
    this.emailCopyService.validateBilingualCopy(sharedCopy);

    const en = this.emailCopyService.interpolate(copy, 'en', args);
    const bn = this.emailCopyService.interpolate(copy, 'bn', args);
    const sharedEn = this.emailCopyService.interpolate(sharedCopy, 'en', args);
    const sharedBn = this.emailCopyService.interpolate(sharedCopy, 'bn', args);
    const shared = {
      copyright: `${sharedEn.copyright ?? ''} · ${sharedBn.copyright ?? ''}`,
      tagline: `${sharedEn.tagline ?? ''} · ${sharedBn.tagline ?? ''}`,
    };

    return template.build({ en, bn, shared, args });
  }
}
