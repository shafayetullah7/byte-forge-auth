# Aponika email templates

Transactional and auth emails are rendered from bilingual copy files and per-template TypeScript builders. Every email includes **English and Bengali** content in a single message (not locale-selected).

## Add a new email

1. **Copy** — create `copy/<domain>/<name>.json` with `{ "field": { "en": "...", "bn": "..." } }` for each string (`subject`, `greeting`, `body`, `cta`, `footer`, etc.).
2. **Template ID** — add to `templates/types/email-template-id.enum.ts`.
3. **Template file** — add `templates/<domain>/<name>.template.ts` using `createStandardTransactionalTemplate` or `createOtpAuthTemplate`.
4. **Registry** — register in `templates/registry/email-template.registry.ts`.
5. **Send path** — emit an `EmailEventNames` event or call `EmailService.sendTransactionalEmail(templateId, to, args)` from a listener/service.
6. **Test** — extend `email-copy.service.spec.ts` / `email-template.service.spec.ts`.

## Layout and branding

- Shared layout: `templates/layout/aponika.layout.ts`
- Theme tokens: `templates/layout/aponika-theme.constants.ts` (aligned with frontend `app.css`)
- Brand name: **Aponika**
- Sender (inbox “From” line): set `MAIL_FROM_NAME` and `MAIL_FROM_EMAIL` in env (e.g. `Aponika` / `noreply@aponika.com`). The SMTP account (`MAIL_USER`) must be authorized to send from that address in production.

## Copy rules

- Use `{placeholder}` for dynamic values; they are HTML-escaped at render time.
- OTP emails pass `otp` and `minutes` args.
- CTA emails pass `viewOrderUrl`, `viewOrdersUrl`, or `viewShopUrl` as appropriate.
