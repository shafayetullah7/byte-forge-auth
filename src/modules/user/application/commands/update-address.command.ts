import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  districtsTable,
  divisionsTable,
  TUserAddress,
} from '@/_db/drizzle/schema';
import { CustomException } from '@/common/exceptions/custom.exception';
import { UpdateAddressDto } from '../../controllers/dto/update-address.dto';
import { UserAddressRepository } from '../../repositories/user-address.repository';

@Injectable()
export class UpdateAddressCommand {
  private readonly logger = new Logger(UpdateAddressCommand.name);

  constructor(
    private readonly addressRepository: UserAddressRepository,
    private readonly db: DrizzleService,
  ) {}

  async execute(
    addressId: string,
    userId: string,
    dto: UpdateAddressDto,
  ): Promise<TUserAddress> {
    try {
      return await this.db.transaction(async (tx) => {
        const existing = await this.addressRepository.findOne(
          { id: addressId, userId },
          { tx, lock: true },
        );

        if (!existing) {
          throw CustomException.notFound({
            message: 'Address not found',
            details: 'No address found with the given ID for this user',
          });
        }

        if (dto.districtId || dto.divisionId) {
          const targetDistrictId = dto.districtId ?? existing.districtId;
          const targetDivisionId = dto.divisionId ?? existing.divisionId;

          const [district, division] = await Promise.all([
            this.validateDistrict(targetDistrictId),
            this.validateDivision(targetDivisionId),
          ]);

          if (district.divisionId !== division.id) {
            throw CustomException.badRequest({
              message: 'Invalid location',
              details:
                'The selected district does not belong to the selected division',
            });
          }
        }

        const effectiveType = dto.type ?? existing.type;

        if (dto.isDefault) {
          await this.addressRepository.update(
            { isDefault: false },
            { userId, type: effectiveType },
            tx,
          );
        }

        const [updated] = await this.addressRepository.update(
          dto,
          { id: addressId, userId },
          tx,
        );

        if (!updated) {
          throw CustomException.databaseError({
            message: 'Failed to update address',
          });
        }

        return updated;
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to update address ${addressId} for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  private async validateDistrict(districtId: string) {
    const district = await this.db.client.query.districtsTable.findFirst({
      where: eq(districtsTable.id, districtId),
      columns: { id: true, divisionId: true },
    });

    if (!district) {
      throw CustomException.badRequest({
        message: 'Invalid district',
        details: `District with ID "${districtId}" does not exist`,
      });
    }

    return district;
  }

  private async validateDivision(divisionId: string) {
    const division = await this.db.client.query.divisionsTable.findFirst({
      where: eq(divisionsTable.id, divisionId),
      columns: { id: true },
    });

    if (!division) {
      throw CustomException.badRequest({
        message: 'Invalid division',
        details: `Division with ID "${divisionId}" does not exist`,
      });
    }

    return division;
  }
}
