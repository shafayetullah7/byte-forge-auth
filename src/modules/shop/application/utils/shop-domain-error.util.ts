import { BadRequestException } from '@nestjs/common';
import { ShopDomainError } from '../../domain/shop.errors';

export function throwIfShopDomainError(error: unknown): void {
  if (error instanceof ShopDomainError) {
    throw new BadRequestException(error.message);
  }
}
