import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaRepository } from '@/_repositories/providers/media/media.repository/media.repository';
import { ImageMimeType } from '@/_db/drizzle/enum/mime.type.enum';
import type { DrizzleTx } from '@/libs/db/types';

@Injectable()
export class PaymentMethodLogoService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  async validateLogoId(
    logoId: string,
    adminId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    const existence = await this.mediaRepository.checkMediaExistence(
      [logoId],
      tx,
    );

    if (!existence.valid) {
      throw new NotFoundException(
        `Logo media '${existence.invalidIds.join(', ')}' not found`,
      );
    }

    const isOwner = await this.mediaRepository.verifyAdminMediaOwnership(
      [logoId],
      adminId,
      tx,
    );

    if (!isOwner) {
      throw new ForbiddenException('Logo media must be uploaded by an admin');
    }

    const records = await this.mediaRepository.findAdminMediaDetailsByIds(
      [logoId],
      { tx, lock: true },
    );

    if (
      records.length !== 1 ||
      !this.mediaRepository.areValidMediaType(
        records.map((record) => record.media),
        [...ImageMimeType],
      )
    ) {
      throw new BadRequestException('Logo must be an admin-uploaded image');
    }
  }

  async applyLogoChange(
    oldLogoId: string | null | undefined,
    newLogoId: string | null | undefined,
    adminId: string,
    tx: DrizzleTx,
  ): Promise<string | null | undefined> {
    if (newLogoId === undefined) {
      return undefined;
    }

    if (newLogoId === null) {
      if (oldLogoId) {
        await this.mediaRepository.decrementMediaUsage([oldLogoId], tx);
      }
      return null;
    }

    if (newLogoId === oldLogoId) {
      return undefined;
    }

    await this.validateLogoId(newLogoId, adminId, tx);

    if (oldLogoId) {
      await this.mediaRepository.decrementMediaUsage([oldLogoId], tx);
    }

    await this.mediaRepository.incrementMediaUsage([newLogoId], tx);
    return newLogoId;
  }
}
