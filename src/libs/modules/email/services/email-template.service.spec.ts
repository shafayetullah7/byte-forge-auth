import { EmailTemplateService } from './email-template.service';
import { EmailCopyService } from './email-copy.service';
import { EmailTemplateId } from '../templates/types/email-template-id.enum';
import { emailTemplateRegistry } from '../templates/registry/email-template.registry';

describe('EmailTemplateService', () => {
  const service = new EmailTemplateService(new EmailCopyService());

  it('renders admin registration OTP with registrant details', () => {
    const rendered = service.render(
      EmailTemplateId.AUTH_ADMIN_REGISTRATION_OTP,
      {
        otp: '654321',
        minutes: '5',
        registrantEmail: 'newadmin@example.com',
        registrantUserName: 'new_admin',
        registrantName: 'Jane Doe',
      },
    );

    expect(rendered.subject).toContain('Admin registration approval');
    expect(rendered.html).toContain('654321');
    expect(rendered.html).toContain('newadmin@example.com');
    expect(rendered.html).toContain('new_admin');
    expect(rendered.html).toContain('Jane Doe');
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
    expect(emailTemplateRegistry.getAllIds().length).toBe(14);
  });
});
