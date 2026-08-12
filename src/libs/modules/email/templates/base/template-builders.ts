import { EmailTemplateId } from '../types/email-template-id.enum';
import type {
  EmailTemplate,
  EmailTemplateBuildContext,
  RenderedEmail,
} from '../types/email-template.types';
import {
  buildAponikaEmail,
  buildBilingualSubject,
} from '../layout/aponika.layout';
import { renderOtpCodeBlock } from '../layout/components/otp-code.block';
import { nl2br } from '@/libs/modules/email/utils/html.util';
import { APONIKA_EMAIL_THEME as theme } from '../layout/aponika-theme.constants';

function buildOtpExtraHtml(expiry: string, otp: string): string {
  const expiryHtml = expiry
    ? `<p style="margin:0 0 8px;font-size:14px;color:${theme.textMuted};">${nl2br(expiry)}</p>`
    : '';
  return `${expiryHtml}${renderOtpCodeBlock(otp)}`;
}

export function createOtpAuthTemplate(id: EmailTemplateId): EmailTemplate {
  return {
    id,
    build(ctx: EmailTemplateBuildContext): RenderedEmail {
      const otp = ctx.args.otp ?? '';
      const enExtraHtml = buildOtpExtraHtml(ctx.en.expiry ?? '', otp);
      const bnExtraHtml = buildOtpExtraHtml(ctx.bn.expiry ?? '', otp);

      const { html, text } = buildAponikaEmail({
        en: ctx.en,
        bn: ctx.bn,
        shared: ctx.shared,
        enExtraHtml,
        bnExtraHtml,
      });

      return {
        subject: buildBilingualSubject(ctx.en, ctx.bn),
        html,
        text,
      };
    },
  };
}

export function createStandardTransactionalTemplate(
  id: EmailTemplateId,
): EmailTemplate {
  return {
    id,
    build(ctx: EmailTemplateBuildContext): RenderedEmail {
      const ctaUrl =
        ctx.args.viewOrderUrl ??
        ctx.args.viewOrdersUrl ??
        ctx.args.viewShopUrl ??
        ctx.args.publicShopUrl ??
        '';

      const { html, text } = buildAponikaEmail({
        en: ctx.en,
        bn: ctx.bn,
        shared: ctx.shared,
        ctaUrl,
      });

      return {
        subject: buildBilingualSubject(ctx.en, ctx.bn),
        html,
        text,
      };
    },
  };
}
