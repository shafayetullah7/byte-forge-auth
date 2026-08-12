import { HttpStatus } from '@nestjs/common';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { ValidatePlantAiThumbnailQuery } from './validate-plant-ai-thumbnail.query';
import { MediaRepository } from '@/modules/media/repositories/media.repository';

describe('ValidatePlantAiThumbnailQuery', () => {
  const mediaRepository = {
    findMediaDetailsById: jest.fn(),
  };

  const appConfig = {
    plantAiMaxImageBytes: 5 * 1024 * 1024,
  };

  const i18n = {
    t: jest.fn((key: string) => key),
  };

  let query: ValidatePlantAiThumbnailQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    query = new ValidatePlantAiThumbnailQuery(
      mediaRepository as unknown as MediaRepository,
      appConfig as unknown as AppConfigService,
      i18n as never,
    );
  });

  it('returns image URL for valid owned image', async () => {
    mediaRepository.findMediaDetailsById.mockResolvedValue({
      media: {
        url: 'https://cdn.example/plant.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      },
      userUploadMedia: { userId: 'user-1' },
    });

    const result = await query.execute('media-1', 'user-1', 'en');
    expect(result).toEqual({ imageUrl: 'https://cdn.example/plant.jpg' });
  });

  it('rejects unsupported image format', async () => {
    mediaRepository.findMediaDetailsById.mockResolvedValue({
      media: {
        url: 'https://cdn.example/plant.tiff',
        mimeType: 'image/tiff',
        size: 1024,
      },
      userUploadMedia: { userId: 'user-1' },
    });

    await expect(query.execute('media-1', 'user-1', 'en')).rejects.toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('rejects oversized image before Gemini call', async () => {
    mediaRepository.findMediaDetailsById.mockResolvedValue({
      media: {
        url: 'https://cdn.example/plant.jpg',
        mimeType: 'image/jpeg',
        size: 6 * 1024 * 1024,
      },
      userUploadMedia: { userId: 'user-1' },
    });

    await expect(query.execute('media-1', 'user-1', 'en')).rejects.toBeInstanceOf(
      CustomException,
    );
  });
});
