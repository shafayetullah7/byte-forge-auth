import { BadRequestException, Injectable } from '@nestjs/common';
import type { ReplaceStorefrontListDto } from '../../controllers/dto/replace-storefront-list.dto';
import { ShopStorefrontRepository } from '../../repositories/shop-storefront.repository';
import { GetStorefrontQuery } from '../queries/get-storefront.query';

@Injectable()
export class ReplaceWhyChooseUsCommand {
  constructor(
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
    private readonly getStorefrontQuery: GetStorefrontQuery,
  ) {}

  async execute(shopId: string, dto: ReplaceStorefrontListDto, lang: string) {
    try {
      await this.shopStorefrontRepository.replaceWhyChooseUs(shopId, dto.items);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Maximum')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    return this.getStorefrontQuery.execute(shopId, lang);
  }
}

@Injectable()
export class ReplaceValuePointsCommand {
  constructor(
    private readonly shopStorefrontRepository: ShopStorefrontRepository,
    private readonly getStorefrontQuery: GetStorefrontQuery,
  ) {}

  async execute(shopId: string, dto: ReplaceStorefrontListDto, lang: string) {
    try {
      await this.shopStorefrontRepository.replaceValuePoints(shopId, dto.items);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Maximum')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    return this.getStorefrontQuery.execute(shopId, lang);
  }
}
