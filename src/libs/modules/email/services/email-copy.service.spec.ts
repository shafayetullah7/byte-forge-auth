import * as fs from 'fs';
import * as path from 'path';
import { EmailCopyService } from './email-copy.service';
import { emailTemplateRegistry } from '../templates/registry/email-template.registry';

describe('Email copy files', () => {
  const copyRoot = path.join(__dirname, '..', 'copy');
  const copyService = new EmailCopyService();

  it('validates bilingual fields for every registered template', () => {
    for (const id of emailTemplateRegistry.getAllIds()) {
      const copy = copyService.load(id);
      expect(() => copyService.validateBilingualCopy(copy)).not.toThrow();
    }
  });

  it('validates shared copy file', () => {
    const shared = copyService.loadShared();
    copyService.validateBilingualCopy(shared);
  });

  it('includes en and bn in every copy json file on disk', () => {
    const files: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.json')) files.push(full);
      }
    };

    walk(copyRoot);

    for (const file of files) {
      const copy = JSON.parse(fs.readFileSync(file, 'utf-8')) as Record<
        string,
        { en?: string; bn?: string }
      >;
      for (const [, value] of Object.entries(copy)) {
        expect(value?.en).toBeTruthy();
        expect(value?.bn).toBeTruthy();
      }
    }
  });
});
