import { AllowedMimeType } from '@/_db/drizzle/enum/mime.type.enum';
import { buildCloudinaryUploadOptions } from './cloudinary-upload.options';

describe('buildCloudinaryUploadOptions', () => {
  it('applies raster image guardrails', () => {
    const options = buildCloudinaryUploadOptions(
      AllowedMimeType.JPEG,
      'sellers/user-1',
    );

    expect(options.folder).toBe('sellers/user-1');
    expect(options.transformation).toEqual([
      { width: 2048, height: 2048, crop: 'limit' },
    ]);
    expect(options.quality).toBe('auto:good');
    expect(options.flags).toBe('strip_profile');
  });

  it('strips EXIF for GIF without resizing', () => {
    const options = buildCloudinaryUploadOptions(AllowedMimeType.GIF, 'sellers/u1');

    expect(options.transformation).toBeUndefined();
    expect(options.quality).toBeUndefined();
    expect(options.flags).toBe('strip_profile');
  });

  it('keeps SVG folder-only', () => {
    const options = buildCloudinaryUploadOptions(AllowedMimeType.SVG, 'sellers/u1');

    expect(options.folder).toBe('sellers/u1');
    expect(options.transformation).toBeUndefined();
    expect(options.flags).toBeUndefined();
  });

  it('keeps PDF folder-only', () => {
    const options = buildCloudinaryUploadOptions(
      AllowedMimeType.PDF,
      'admin/media',
    );

    expect(options.folder).toBe('admin/media');
    expect(options.transformation).toBeUndefined();
    expect(options.quality).toBeUndefined();
  });
});
