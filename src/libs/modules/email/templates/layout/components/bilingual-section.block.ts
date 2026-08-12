import { APONIKA_EMAIL_THEME as theme } from '../aponika-theme.constants';
import { nl2br } from '@/libs/modules/email/utils/html.util';

export function renderLanguageSection(params: {
  label: string;
  greeting: string;
  body: string;
  extraHtml?: string;
  footerNote?: string;
}): string {
  const { label, greeting, body, extraHtml = '', footerNote = '' } = params;

  return `
    <div style="margin-bottom:8px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${theme.textMuted};">${label}</p>
      <p style="margin:0 0 12px;font-size:16px;color:${theme.textPrimary};">${nl2br(greeting)}</p>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:${theme.textPrimary};">${nl2br(body)}</p>
      ${extraHtml}
      ${footerNote ? `<p style="margin:12px 0 0;font-size:13px;color:${theme.textMuted};">${nl2br(footerNote)}</p>` : ''}
    </div>
  `;
}

export function renderBilingualDivider(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-top:1px solid ${theme.borderLight};padding-top:24px;">
          <p style="margin:0;font-size:12px;color:${theme.textMuted};text-align:center;">English · বাংলা</p>
        </td>
      </tr>
    </table>
  `;
}
