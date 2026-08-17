import { resolveSellerUploadFolder } from '../../media-upload-folder.util';

describe('resolveSellerUploadFolder', () => {
  it('defaults to sellers/{userId}', () => {
    expect(resolveSellerUploadFolder('abc-123')).toBe('sellers/abc-123');
  });

  it('appends a sanitized subfolder', () => {
    expect(resolveSellerUploadFolder('abc-123', 'products/plants')).toBe(
      'sellers/abc-123/products/plants',
    );
  });

  it('rejects path traversal segments', () => {
    expect(resolveSellerUploadFolder('abc-123', '../etc/passwd')).toBe(
      'sellers/abc-123',
    );
    expect(resolveSellerUploadFolder('abc-123', 'foo/../../bar')).toBe(
      'sellers/abc-123',
    );
  });
});
