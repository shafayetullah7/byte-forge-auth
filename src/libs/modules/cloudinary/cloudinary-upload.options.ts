import type { UploadApiOptions } from 'cloudinary';
import {
  AllowedMimeType,
  TAllowedMimeType,
} from '@/_db/drizzle/enum/mime.type.enum';

const RASTER_IMAGE_MIMES = new Set<TAllowedMimeType>([
  AllowedMimeType.JPEG,
  AllowedMimeType.PNG,
  AllowedMimeType.WEBP,
]);

const MAX_IMAGE_DIMENSION = 2048;

export function buildCloudinaryUploadOptions(
  mimeType: string,
  folder?: string,
): UploadApiOptions {
  const options: UploadApiOptions = {};

  if (folder) {
    options.folder = folder;
  }

  if (RASTER_IMAGE_MIMES.has(mimeType as TAllowedMimeType)) {
    options.transformation = [
      {
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        crop: 'limit',
      },
    ];
    options.quality = 'auto:good';
    options.flags = 'strip_profile';
    return options;
  }

  if (mimeType === AllowedMimeType.GIF) {
    options.flags = 'strip_profile';
    return options;
  }

  if (mimeType === AllowedMimeType.SVG) {
    return options;
  }

  // Video, audio, documents: folder only
  return options;
}
