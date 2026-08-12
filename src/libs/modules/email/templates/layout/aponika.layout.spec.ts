import { buildAponikaEmail } from './aponika.layout';
import { APONIKA_EMAIL_THEME } from './aponika-theme.constants';

describe('buildAponikaEmail', () => {
  it('renders bilingual Aponika branded HTML', () => {
    const { html, text } = buildAponikaEmail({
      en: {
        subject: 'Test — Aponika',
        greeting: 'Hello!',
        body: 'English body',
        footer: 'English footer',
      },
      bn: {
        subject: 'পরীক্ষা — অপনিকা',
        greeting: 'হ্যালো!',
        body: 'বাংলা বার্তা',
        footer: 'বাংলা ফুটার',
      },
      shared: {
        copyright: '© Aponika',
        tagline: 'Plant marketplace',
      },
    });

    expect(html).toContain(APONIKA_EMAIL_THEME.brandName);
    expect(html).toContain('English');
    expect(html).toContain('বাংলা');
    expect(html).toContain('Hello!');
    expect(html).toContain('হ্যালো!');
    expect(html).toContain(APONIKA_EMAIL_THEME.forest800);
    expect(text).toContain('--- English ---');
    expect(text).toContain('--- বাংলা ---');
  });
});
