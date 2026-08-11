import { Injectable } from '@nestjs/common';

/**
 * Placeholder — full image upload wiring stays deferred.
 */
@Injectable()
export class UploadShopImagesCommand {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    shopId: string,
    files: { logo?: Express.Multer.File; banner?: Express.Multer.File },
  ): Promise<{ logoId?: string; bannerId?: string }> {
    void shopId;
    void files;
    return {};
  }
}
