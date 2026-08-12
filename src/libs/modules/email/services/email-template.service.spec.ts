import { EmailTemplateService } from './email-template.service';
import { EmailCopyService } from './email-copy.service';
import { EmailTemplateId } from '../templates/types/email-template-id.enum';
import { emailTemplateRegistry } from '../templates/registry/email-template.registry';

describe('EmailTemplateService', () => {
  const service = new EmailTemplateService(new EmailCopyService());

  it('renders account verification with OTP and both languages', () => {
    const rendered = service.render(EmailTemplateId.AUTH_ACCOUNT_VERIFICATION, {
      otp: '123456',
      minutes: '5',
    });

    expect(rendered.subject).toContain('Verify your email');
    expect(rendered.subject).toContain('আপনার ইমেইল');
    expect(rendered.html).toContain('123456');
    expect(rendered.html).toContain('Aponika');
    expect(rendered.html).toContain('Hello!');
    expect(rendered.html).toContain('হ্যালো!');
    expect(rendered.text).toContain('5 minutes');
  });

  it('escapes HTML in interpolated args', () => {
    const rendered = service.render(EmailTemplateId.ORDERS_SHIPPED, {
      orderNumber: 'ORD-1',
      notes: '<script>alert(1)</script>',
      viewOrderUrl: 'https://example.com/orders/1',
    });

    expect(rendered.html).not.toContain('<script>');
    expect(rendered.html).toContain('&lt;script&gt;');
  });
});

describe('emailTemplateRegistry', () => {
  it('registers all template ids', () => {
    expect(emailTemplateRegistry.getAllIds().length).toBe(15);
  });
});
