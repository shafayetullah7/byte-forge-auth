import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { districtsTable, divisionsTable } from '@/_db/drizzle/schema/location';

@Injectable()
export class LocationRepository {
  constructor(private readonly db: DrizzleService) {}

  findAllDivisionsWithDistricts() {
    return this.db.client.query.divisionsTable.findMany({
      with: {
        translations: true,
        districts: {
          with: {
            translations: true,
          },
          orderBy: (t, { asc }) => asc(t.sortOrder),
        },
      },
      orderBy: (t, { asc }) => asc(t.sortOrder),
    });
  }

  findDivisionByIdWithDistricts(id: string) {
    return this.db.client.query.divisionsTable.findFirst({
      where: eq(divisionsTable.id, id),
      with: {
        translations: true,
        districts: {
          with: {
            translations: true,
          },
          orderBy: (t, { asc }) => asc(t.sortOrder),
        },
      },
    });
  }

  findAllDistricts() {
    return this.db.client.query.districtsTable.findMany({
      with: {
        translations: true,
      },
      orderBy: (t, { asc }) => asc(t.sortOrder),
    });
  }

  findDistrictById(id: string) {
    return this.db.client.query.districtsTable.findFirst({
      where: eq(districtsTable.id, id),
      with: {
        translations: true,
      },
    });
  }
}
