import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryService } from '@/common/modules/cloudinary/cloudinary.service';
import { AppLoggerService } from '@/common/modules/logger/app.logger.service';
import { AuthenticAdmin } from '@/common/types';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { TMedia, TNewMedia } from '@/_db/drizzle/schema';
import { MediaRepository } from '../repositories/media.repository';
import { TAllowedMimeType } from '@/_db/drizzle/enum/mime.type.enum';

@Injectable()
export class AdminMediaService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly mediaRepository: MediaRepository,
    private readonly db: DrizzleService,
    private readonly logger: AppLoggerService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    authenticAdmin: AuthenticAdmin,
    options: {
      folder: string;
      allowedMimeTypes: TAllowedMimeType[];
    },
  ): Promise<TMedia> {
    if (!options.allowedMimeTypes.includes(file.mimetype as TAllowedMimeType)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed for this upload endpoint`,
      );
    }

    let cloudinaryUpload: UploadApiResponse;
    try {
      cloudinaryUpload = await this.cloudinaryService.uploadFile(
        file,
        options.folder,
      );
    } catch (e) {
      this.logger.error('could not upload Cloudinary file for admin', e);
      throw new InternalServerErrorException(
        'Failed to upload file to Cloudinary',
      );
    }

    try {
      const mediaData: TNewMedia = {
        fileName: file.originalname,
        mimeType: file.mimetype as TAllowedMimeType,
        size: file.size,
        url: cloudinaryUpload.secure_url,
      };

      return this.db.client.transaction(async (tx) =>
        this.mediaRepository.createAdminMedia(
          {
            media: mediaData,
            adminId: authenticAdmin.admin.id,
            cloudinary: { publicKey: cloudinaryUpload.public_id },
          },
          tx,
        ),
      );
    } catch (e) {
      this.logger.error(
        `could not save admin media ${cloudinaryUpload.public_id}`,
        e,
      );
      try {
        await this.cloudinaryService.deleteFile(cloudinaryUpload.public_id);
      } catch (deleteError) {
        this.logger.error(
          `Rollback failed for admin media ${cloudinaryUpload.public_id}`,
          deleteError,
        );
      }
      throw new InternalServerErrorException(
        'Failed to save file record in database',
      );
    }
  }

  async deleteMedia(
    mediaId: string,
    authenticAdmin: AuthenticAdmin,
  ): Promise<void> {
    await this.db.client.transaction(async (tx) => {
      const mediaRecord = await this.mediaRepository.findAdminMediaDetailsById(
        mediaId,
        { tx, lock: true },
      );

      if (
        !mediaRecord ||
        mediaRecord.adminUploadMedia.adminId !== authenticAdmin.admin.id
      ) {
        throw new NotFoundException('Media not found');
      }

      if (mediaRecord.media.usesCount > 0) {
        throw new ForbiddenException('File is already in use');
      }

      await this.mediaRepository.deleteMedia(mediaRecord.media.id, tx);

      if (mediaRecord.cloudinaryMedia?.publicKey) {
        await this.cloudinaryService.deleteFile(
          mediaRecord.cloudinaryMedia.publicKey,
        );
      }
    });
  }
}
