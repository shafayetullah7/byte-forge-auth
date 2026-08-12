import { HttpStatus, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';
import { MediaRepository } from '@/modules/media/repositories/media.repository';
import { isAllowedPlantAiImageMime } from './plant-ai-request.util';

@Injectable()
export class ValidatePlantAiThumbnailQuery {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly appConfig: AppConfigService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    mediaId: string,
    userId: string,
    lang: string,
  ): Promise<{ imageUrl: string }> {
    const record = await this.mediaRepository.findMediaDetailsById(mediaId);

    if (!record) {
      throw new CustomException({
        message: this.i18n.t('message.error.mediaNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    if (record.userUploadMedia.userId !== userId) {
      throw new CustomException({
        message: this.i18n.t('message.error.mediaNotOwned', { lang }),
        statusCode: HttpStatus.FORBIDDEN,
        errorCode: ErrorCode.FORBIDDEN,
      });
    }

    if (!record.media.mimeType.startsWith('image/')) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantAiThumbnailMustBeImage', {
          lang,
        }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    if (!isAllowedPlantAiImageMime(record.media.mimeType)) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantAiThumbnailUnsupportedFormat', {
          lang,
        }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    const maxBytes = this.appConfig.plantAiMaxImageBytes;
    if (record.media.size > maxBytes) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantAiImageTooLarge', { lang }),
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    }

    return { imageUrl: record.media.url };
  }
}
