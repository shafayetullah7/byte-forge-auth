import { Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { userAddressesTable } from '@/_db/drizzle/schema';
import { CustomException } from '@/common/exceptions/custom.exception';
import { AddressResponseDto } from '../../controllers/response/address-response.dto';
import { mapAddressToResponse } from '../../mappers/address-response.mapper';

@Injectable()
export class GetAddressByIdQuery {
  private readonly logger = new Logger(GetAddressByIdQuery.name);

  constructor(private readonly db: DrizzleService) {}

  async execute(
    addressId: string,
    userId: string,
    locale: string = 'en',
  ): Promise<AddressResponseDto> {
    try {
      const address = await this.db.client.query.userAddressesTable.findFirst({
        where: and(
          eq(userAddressesTable.id, addressId),
          eq(userAddressesTable.userId, userId),
        ),
        with: {
          district: { with: { translations: true } },
          division: { with: { translations: true } },
        },
      });

      if (!address) {
        throw CustomException.notFound({
          message: 'Address not found',
          details: 'No address found with the given ID for this user',
        });
      }

      return mapAddressToResponse(address, locale);
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to get address ${addressId} for user ${userId}`,
        error,
      );
      throw error;
    }
  }
}
