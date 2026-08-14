import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../application/media.service';
import { TAuthenticUser } from '@/libs/types';
import { UserAuthGuard } from '@/libs/guards/user-auth-guard/user-auth.guard';
import { AuthenticUser } from '@/libs/decorators/authentic-user.decorator';
import { DeleteMediaDto } from './dto/delete-media.dto';
import {
  AllowedMimeType,
  TAllowedMimeType,
} from '@/_db/drizzle/enum/mime.type.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { ResponseService } from '@/libs/modules/response/response.service';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@/libs/decorators/api-error.decorator';

@ApiTags('📁 Media')
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Uploads an image or video file to Cloudinary.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiBadRequestResponse('INVALID_FILE_TYPE')
  @ApiUnauthorizedResponse()
  @Post('upload')
  @UseGuards(UserAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
      fileFilter: (req, file, callback) => {
        if (
          !Object.values(AllowedMimeType).includes(
            file.mimetype as TAllowedMimeType,
          )
        ) {
          return callback(
            new BadRequestException(
              `File type ${file.mimetype} is not allowed`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @Req() req: Request,
    @I18nLang() lang: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const folder =
      typeof req.body?.folder === 'string' && req.body.folder.trim().length > 0
        ? req.body.folder.trim()
        : undefined;

    const media = await this.mediaService.saveFile({
      file,
      authenticUser,
      folder,
    });

    return this.responseService.success({
      message: this.i18n.t('message.success.mediaUploaded', { lang }),
      data: media,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('File')
  @ApiForbiddenResponse('File is in use')
  @Delete(':id')
  @UseGuards(UserAuthGuard)
  async deleteMedia(
    @Param() params: DeleteMediaDto,
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    await this.mediaService.deleteMedia(params.id, authenticUser);
    return this.responseService.success({
      message: this.i18n.t('message.success.mediaDeleted', { lang }),
      data: null,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get all media for current user' })
  @ApiResponse({ status: 200, description: 'Media list retrieved' })
  @ApiUnauthorizedResponse()
  @Get()
  @UseGuards(UserAuthGuard)
  async getMedia(
    @AuthenticUser() authenticUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const result = await this.mediaService.getAllMedia(authenticUser);
    return this.responseService.success({
      message: this.i18n.t('message.success.mediaRetrieved', { lang }),
      data: result,
    });
  }
}
