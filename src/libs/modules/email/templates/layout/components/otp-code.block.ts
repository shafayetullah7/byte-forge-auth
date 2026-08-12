import { APONIKA_EMAIL_THEME as theme } from '../aponika-theme.constants';
import { escapeHtml } from '@/libs/modules/email/utils/html.util';

export function renderOtpCodeBlock(otp: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td align="center" style="background-color:${theme.otpBackground};border:2px solid ${theme.terracotta500};border-radius:8px;padding:20px;">
          <span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:${theme.textPrimary};">${escapeHtml(otp)}</span>
        </td>
      </tr>
    </table>
  `;
}
