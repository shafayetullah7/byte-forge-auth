import type { EmailTemplateId } from './email-template-id.enum';

export type BilingualString = { en: string; bn: string };

export type EmailCopyFile = Record<string, BilingualString>;

export type InterpolatedCopy = Record<string, string>;

export type EmailRenderArgs = Record<string, string>;

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EmailTemplateBuildContext {
  en: InterpolatedCopy;
  bn: InterpolatedCopy;
  shared: InterpolatedCopy;
  args: EmailRenderArgs;
}

export interface EmailTemplate {
  readonly id: EmailTemplateId;
  build(ctx: EmailTemplateBuildContext): RenderedEmail;
}
