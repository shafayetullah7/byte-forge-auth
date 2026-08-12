import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EmailTemplateId } from '../templates/types/email-template-id.enum';
import type {
  EmailCopyFile,
  InterpolatedCopy,
  EmailRenderArgs,
} from '../templates/types/email-template.types';
import { escapeHtml } from '../utils/html.util';

@Injectable()
export class EmailCopyService {
  private readonly copyRoot = path.join(__dirname, '..', 'copy');
  private readonly cache = new Map<string, EmailCopyFile>();

  load(templateId: EmailTemplateId): EmailCopyFile {
    const cached = this.cache.get(templateId);
    if (cached) return cached;

    const relativePath = templateId.replace(/\./g, '/') + '.json';
    const filePath = path.join(this.copyRoot, relativePath);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const copy = JSON.parse(raw) as EmailCopyFile;
    this.cache.set(templateId, copy);
    return copy;
  }

  loadShared(): EmailCopyFile {
    const cached = this.cache.get('__shared__');
    if (cached) return cached;

    const filePath = path.join(this.copyRoot, '_shared.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const copy = JSON.parse(raw) as EmailCopyFile;
    this.cache.set('__shared__', copy);
    return copy;
  }

  interpolate(
    copy: EmailCopyFile,
    lang: 'en' | 'bn',
    args: EmailRenderArgs,
  ): InterpolatedCopy {
    const result: InterpolatedCopy = {};

    for (const [key, bilingual] of Object.entries(copy)) {
      result[key] = this.interpolateString(bilingual[lang], args);
    }

    return result;
  }

  private interpolateString(template: string, args: EmailRenderArgs): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = args[key] ?? '';
      return escapeHtml(String(value));
    });
  }

  validateBilingualCopy(copy: EmailCopyFile): void {
    for (const [field, value] of Object.entries(copy)) {
      if (!value?.en || !value?.bn) {
        throw new Error(`Email copy field "${field}" must have en and bn keys`);
      }
    }
  }
}
