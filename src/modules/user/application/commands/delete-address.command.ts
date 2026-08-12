import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { userAddressesTable } from '@/_db/drizzle/schema';
import { CustomException } from '@/common/exceptions/custom.exception';
import { UserAddressRepository } from '../../repositories/user-address.repository';

@Injectable()
export class DeleteAddressCommand {
  private readonly logger = new Logger(DeleteAddressCommand.name);

  constructor(private readonly addressRepository: UserAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    try {
      const address = await this.addressRepository.findOne({
        id: addressId,
        userId,
      });

      if (!address) {
        throw CustomException.notFound({
          message: 'Address not found',
          details: 'No address found with the given ID for this user',
        });
      }

      const deleted = await this.addressRepository.delete(
        eq(userAddressesTable.id, addressId),
      );

      if (!deleted) {
        throw CustomException.databaseError({
          message: 'Failed to delete address',
        });
      }
    } catch (error) {
      if (error instanceof CustomException) throw error;
      this.logger.error(
        `Failed to delete address ${addressId} for user ${userId}`,
        error,
      );
      throw error;
    }
  }
}
