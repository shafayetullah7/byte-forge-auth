import { Injectable } from '@nestjs/common';

/**
 * Placeholder — full delete needs orders module coordination.
 */
@Injectable()
export class DeleteShopCommand {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(shopId: string, lang: string): Promise<void> {
    void lang;
    console.log('Delete shop:', shopId);
  }
}
