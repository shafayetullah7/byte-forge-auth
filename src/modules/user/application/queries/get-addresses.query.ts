import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { userAddressesTable } from '@/_db/drizzle/schema';
import { PaginationParams } from '@/libs/schemas/pagination.schema';
import { AddressResponseDto } from '../../controllers/response/address-response.dto';
import { mapAddressToResponse } from '../../mappers/address-response.mapper';

@Injectable()
export class GetAddressesQuery {
  private readonly logger = new Logger(GetAddressesQuery.name);

  constructor(private readonly db: DrizzleService) {}

  async execute(
    userId: string,
    locale: string,
    pagination?: PaginationParams & { type?: 'shipping' | 'billing' | 'both' },
  ): Promise<{ addresses: AddressResponseDto[]; total: number }> {
    try {
      const typeFilter =
        pagination?.type && pagination.type !== 'both'
          ? pagination.type
          : undefined;

      const addresses = await this.db.client.query.userAddressesTable.findMany({
        where: typeFilter
          ? and(
              eq(userAddressesTable.userId, userId),
              eq(userAddressesTable.type, typeFilter),
            )
          : eq(userAddressesTable.userId, userId),
        orderBy: (table, { asc }) => asc(table.createdAt),
        with: {
          district: {
            with: {
              translations: true,
            },
          },
          division: {
            with: {
              translations: true,
            },
          },
        },
      });

      if (addresses.length === 0) {
        return { addresses: [], total: 0 };
      }

      const resolvedAddresses = addresses.map((row) =>
        mapAddressToResponse(row, locale),
      );

      return {
        addresses: resolvedAddresses,
        total: resolvedAddresses.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get addresses for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
