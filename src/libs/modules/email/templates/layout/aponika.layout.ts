import { APONIKA_EMAIL_THEME as theme } from './aponika-theme.constants';
import {
  renderBilingualDivider,
  renderLanguageSection,
} from './components/bilingual-section.block';
import { renderCtaButton } from './components/cta-button.block';
import { stripHtmlTags } from '../../utils/html.util';

export interface AponikaLayoutContent {
  en: Record<string, string>;
  bn: Record<string, string>;
  shared: Record<string, string>;
  enExtraHtml?: string;
  bnExtraHtml?: string;
  ctaUrl?: string;
}

export function buildBilingualSubject(
  en: Record<string, string>,
  bn: Record<string, string>,
): string {
  return `${en.subject ?? ''} · ${bn.subject ?? ''}`;
}

export function buildAponikaEmail(content: AponikaLayoutContent): {
  html: string;
  text: string;
} {
  const {
    en,
    bn,
    shared,
    enExtraHtml = '',
    bnExtraHtml = '',
    ctaUrl = '',
  } = content;
  const ctaLabelEn = en.cta ?? '';
  const ctaLabelBn = bn.cta ?? '';
  const ctaEnHtml = renderCtaButton(ctaLabelEn, ctaUrl);
  const ctaBnHtml = renderCtaButton(ctaLabelBn, ctaUrl);

  const enSection = renderLanguageSection({
    label: 'English',
    greeting: en.greeting ?? '',
    body: en.body ?? '',
    extraHtml: `${enExtraHtml}${ctaEnHtml}`,
    footerNote: en.ignore ?? en.footer ?? '',
  });

  const bnSection = renderLanguageSection({
    label: 'বাংলা',
    greeting: bn.greeting ?? '',
    body: bn.body ?? '',
    extraHtml: `${bnExtraHtml}${ctaBnHtml}`,
    footerNote: bn.ignore ?? bn.footer ?? '',
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:${theme.cream50};font-family:${theme.fontFamily};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${theme.cream50};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:${theme.maxWidth};">
          <tr>
            <td style="background-color:${theme.forest800};border-radius:8px 8px 0 0;padding:24px;text-align:center;">
              <span style="font-size:28px;font-weight:bold;color:${theme.cream50};letter-spacing:2px;">${theme.brandName}</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border:1px solid ${theme.borderLight};border-top:none;border-radius:0 0 8px 8px;padding:32px 28px;">
              ${enSection}
              ${renderBilingualDivider()}
              ${bnSection}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:${theme.textFooter};">${shared.copyright ?? `© ${theme.brandName}`}</p>
              <p style="margin:0;font-size:11px;color:${theme.textFooter};">${shared.tagline ?? ''}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const textEn = [
    '--- English ---',
    en.greeting,
    en.body,
    stripHtmlTags(en.expiry ?? ''),
    stripHtmlTags(en.ignore ?? en.footer ?? ''),
    ctaLabelEn && ctaUrl ? `${ctaLabelEn}: ${ctaUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const textBn = [
    '--- বাংলা ---',
    bn.greeting,
    bn.body,
    stripHtmlTags(bn.expiry ?? ''),
    stripHtmlTags(bn.ignore ?? bn.footer ?? ''),
    ctaLabelBn && ctaUrl ? `${ctaLabelBn}: ${ctaUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const text = `${textEn}\n\n${textBn}\n\n${shared.copyright ?? ''}`.trim();

  return { html, text };
}
