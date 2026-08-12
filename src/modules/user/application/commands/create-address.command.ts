import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  districtsTable,
  divisionsTable,
  TUserAddress,
} from '@/_db/drizzle/schema';
import { CustomException } from '@/common/exceptions/custom.exception';
import { CreateAddressDto } from '../../controllers/dto/create-address.dto';
import { UserAddressRepository } from '../../repositories/user-address.repository';

@Injectable()
export class CreateAddressCommand {
  private readonly logger = new Logger(CreateAddressCommand.name);

  constructor(
    private readonly addressRepository: UserAddressRepository,
    private readonly db: DrizzleService,
  ) {}

  async execute(userId: string, dto: CreateAddressDto): Promise<TUserAddress> {
    try {
      const [district, division] = await Promise.all([
        this.validateDistrict(dto.districtId),
        this.validateDivision(dto.divisionId),
      ]);

      if (district.divisionId !== division.id) {
        throw CustomException.badRequest({
          message: 'Invalid location',
          details:
            'The selected district does not belong to the selected division',
        });
      }

      return await this.db.transaction(async (tx) => {
        if (dto.isDefault) {
          await this.addressRepository.update(
            { isDefault: false },
            { userId, type: dto.type },
            tx,
          );
        }

        return this.addressRepository.create({ ...dto, userId }, tx);
      });
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(`Failed to create address for user ${userId}`, error);
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
