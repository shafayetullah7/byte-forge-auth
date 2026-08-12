import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { languagesTable } from '@/_db/drizzle/schema/i18n/language.schema';
import type { TNewLanguage } from '@/_db/drizzle/schema/i18n/language.schema';

@Injectable()
export class LanguageRepository {
  constructor(private readonly db: DrizzleService) {}

  findAll() {
    return this.db.client.query.languagesTable.findMany({
      orderBy: (languages, { asc }) => [asc(languages.name)],
    });
  }

  findByCode(code: string) {
    return this.db.client.query.languagesTable.findFirst({
      where: eq(languagesTable.code, code),
    });
  }

  create(values: TNewLanguage) {
    return this.db.client
      .insert(languagesTable)
      .values(values)
      .returning()
      .then(([lang]) => lang);
  }

  update(code: string, values: Partial<TNewLanguage>) {
    return this.db.client
      .update(languagesTable)
      .set(values)
      .where(eq(languagesTable.code, code))
      .returning()
      .then(([updated]) => updated);
  }
}
