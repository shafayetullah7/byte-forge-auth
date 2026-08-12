import { APONIKA_EMAIL_THEME as theme } from '../aponika-theme.constants';
import { escapeHtml } from '@/libs/modules/email/utils/html.util';

export function renderCtaButton(label: string, url: string): string {
  if (!url) return '';

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="border-radius:6px;background-color:${theme.terracotta500};">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;font-family:${theme.fontFamily};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
  `;
}
