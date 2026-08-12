import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { AuthenticAdminUser } from '@/libs/decorators/authentic-admin.decorator';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/libs/decorators/api-error.decorator';
import { ResponseService } from '@/libs/modules/response/response.service';
import { AuthenticAdmin } from '@/libs/types';
import {
  AllowedMimeType,
  ImageMimeType,
  TAllowedMimeType,
} from '@/_db/drizzle/enum/mime.type.enum';
import { AdminMediaService } from '../application/admin-media.service';
import { DeleteMediaDto } from './dto/delete-media.dto';

const ALL_ALLOWED_MIME_TYPES = Object.values(AllowedMimeType);

function createMimeFilter(allowed: TAllowedMimeType[]) {
  return (
    _req: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowed.includes(file.mimetype as TAllowedMimeType)) {
      return callback(
        new BadRequestException(`File type ${file.mimetype} is not allowed`),
        false,
      );
    }
    callback(null, true);
  };
}

@ApiTags('📁 Admin - Media')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller('admin/media')
export class AdminMediaController {
  constructor(
    private readonly adminMediaService: AdminMediaService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({
    summary: 'Upload common media',
    description:
      'Upload images, documents, audio, or video for admin-managed content.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: createMimeFilter(ALL_ALLOWED_MIME_TYPES),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const data = await this.adminMediaService.uploadFile(file, admin, {
      folder: 'admin/media',
      allowedMimeTypes: ALL_ALLOWED_MIME_TYPES,
    });

    return this.responseService.success({
      data,
      message: 'File uploaded successfully',
    });
  }

  @ApiOperation({
    summary: 'Upload image media',
    description:
      'Upload an image for admin-managed branding and catalog assets.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: createMimeFilter([...ImageMimeType]),
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const data = await this.adminMediaService.uploadFile(file, admin, {
      folder: 'admin/images',
      allowedMimeTypes: [...ImageMimeType],
    });

    return this.responseService.success({
      data,
      message: 'Image uploaded successfully',
    });
  }

  @ApiOperation({ summary: 'Delete admin media file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('File')
  @ApiForbiddenResponse('File is in use')
  @Delete(':id')
  async deleteMedia(
    @Param() params: DeleteMediaDto,
    @AuthenticAdminUser() admin: AuthenticAdmin,
  ) {
    await this.adminMediaService.deleteMedia(params.id, admin);
    return this.responseService.success({
      data: null,
      message: 'File deleted successfully',
    });
  }
}
