import { CloudinaryService } from '@/libs/modules/cloudinary/cloudinary.service';
import { AppLoggerService } from '@/libs/modules/logger/app.logger.service';
import { TAuthenticUser } from '@/libs/types';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  cloudinaryMediaTable,
  mediaTable,
  TNewMedia,
  userUploadMediaTable,
} from '@/_db/drizzle/schema';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  not,
  SQL,
} from 'drizzle-orm';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { MediaRepository } from '../repositories/media.repository';
import { TAllowedMimeType } from '@/_db/drizzle/enum/mime.type.enum';
import { DrizzleTx } from '@/_db/drizzle/types';

type QueryOptions = {
  userId?: string;
  used?: boolean;
  mediaIds?: string[];
  transactionInfo?: {
    transaction?: PgTransaction<any, any, any>;
    lock?: boolean;
  };
};

@Injectable()
export class MediaService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly mediaRepository: MediaRepository,
    private readonly db: DrizzleService,
    private readonly logger: AppLoggerService,
  ) {}

  async saveFile(payload: {
    file: Express.Multer.File;
    authenticUser: TAuthenticUser;
    folder?: string;
  }) {
    const { file, authenticUser, folder } = payload;

    let cloudinaryUpload: UploadApiResponse;
    try {
      cloudinaryUpload = await this.cloudinaryService.uploadFile(file, folder);
    } catch (e) {
      this.logger.error(`could not upload Cloudinary file`, e);
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
      const media = await this.db.client.transaction(async (tx) => {
        const createdMedia = await this.mediaRepository.createMedia(
          {
            media: mediaData,
            userId: authenticUser.user.id,
            cloudinary: {
              publicKey: cloudinaryUpload.public_id,
            },
          },
          tx,
        );
        return createdMedia;
      });

      return media;
    } catch (e) {
      this.logger.error(
        `could not upload Cloudinary file ${cloudinaryUpload.public_id}`,
        e,
      );
      try {
        await this.cloudinaryService.deleteFile(cloudinaryUpload.public_id);
        this.logger.warn(
          `Rolled back Cloudinary file: ${cloudinaryUpload.public_id}`,
        );
      } catch (deleteError) {
        this.logger.error(
          `Rollback failed — could not delete Cloudinary file ${cloudinaryUpload.public_id}`,
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
    authenticUser: TAuthenticUser,
  ): Promise<void> {
    try {
      await this.db.client.transaction(async (tx) => {
        const mediaRecord = await this.mediaRepository.findMediaDetailsById(
          mediaId,
          {
            tx,
            lock: true,
          },
        );

        if (
          !mediaRecord ||
          mediaRecord.userUploadMedia.userId !== authenticUser.user.id
        ) {
          throw new NotFoundException('Media not found');
        }
        if (mediaRecord.media.usesCount > 0) {
          throw new ForbiddenException('File is already in use');
        }
        const { media, cloudinaryMedia } = mediaRecord;
        await this.mediaRepository.deleteMedia(media.id, tx);

        if (cloudinaryMedia?.id) {
          await this.cloudinaryService.deleteFile(cloudinaryMedia.publicKey);
        }
      });
    } catch (error) {
      this.logger.error('Failed to delete media resource', error);
      throw new InternalServerErrorException('Failed to delete media resource');
    }
  }

  async getAllMedia(authenticUser: TAuthenticUser) {
    const mediaRecords = await this.db.client
      .select({
        media: getTableColumns(mediaTable),
        userUploadMedia: getTableColumns(userUploadMediaTable),
        cloudinaryMedia: getTableColumns(cloudinaryMediaTable),
      })
      .from(mediaTable)
      .innerJoin(
        userUploadMediaTable,
        eq(mediaTable.id, userUploadMediaTable.mediaId),
      )
      .leftJoin(
        cloudinaryMediaTable,
        eq(mediaTable.id, cloudinaryMediaTable.mediaId),
      )
      .where(eq(userUploadMediaTable.userId, authenticUser.user.id));

    return mediaRecords;
  }

  async getUserMedia(queryOptions: QueryOptions) {
    const { transactionInfo = {}, used, userId, mediaIds } = queryOptions;
    const { transaction, lock } = transactionInfo;

    const executor = transaction || this.db.client;

    const conditions: SQL[] = [];

    if (mediaIds?.length) {
      conditions.push(inArray(mediaTable.id, mediaIds));
    }
    if (userId) {
      conditions.push(eq(userUploadMediaTable.userId, userId));
    }
    if (used !== undefined) {
      if (used) {
        conditions.push(not(isNull(mediaTable.usesCount)));
      } else {
        conditions.push(isNull(mediaTable.usesCount));
      }
    }
    const query = executor
      .select({
        media: getTableColumns(mediaTable),
        userUploadMedia: getTableColumns(userUploadMediaTable),
      })
      .from(mediaTable)
      .innerJoin(
        userUploadMediaTable,
        eq(mediaTable.id, userUploadMediaTable.mediaId),
      )
      .where(and(...conditions));

    if (lock) {
      query.for('update');
    }

    const mediaRecords = await query.execute();
    return mediaRecords;
  }

  async useMedia(
    payload: {
      mediaIds: string[];
      userId: string;
      validMimeTypes: TAllowedMimeType[];
    },
    tx: DrizzleTx,
  ) {
    const { mediaIds, userId, validMimeTypes } = payload;
    const mediaRecords = await this.getUserMedia({
      mediaIds,
      userId,
      transactionInfo: {
        transaction: tx,
        lock: true,
      },
    });

    // if (mediaRecords.length !== mediaIds.length) {
    //   throw new NotFoundException('Not all media records found');
    // }

    const mediaRecordMap = mediaRecords.reduce((map, record) => {
      map[record.media.id] = record;
      return map;
    }, {});

    mediaIds.forEach((mediaId) => {
      if (!mediaRecordMap[mediaId]) {
        throw new NotFoundException(
          `Media record with id ${mediaId} not found`,
        );
      }
    });

    const plainMediaRecords = mediaRecords.map((record) => record.media);

    if (
      !this.mediaRepository.areValidMediaType(plainMediaRecords, validMimeTypes)
    ) {
      throw new ForbiddenException('File type is not allowed');
    }

    if (this.mediaRepository.areMediaUsed(plainMediaRecords)) {
      throw new ForbiddenException('File is already in use');
    }

    // Increment usage count instead of setting usedAt
    return this.mediaRepository.incrementMediaUsage(mediaIds, tx);
  }
}
