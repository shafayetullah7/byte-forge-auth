import { Injectable } from '@nestjs/common';
import type { ArchiveProductDto } from '../../controllers/dto/admin-products-query.dto';
import { ProductAdminRepository } from '../../repositories/product-admin.repository';

@Injectable()
export class ArchiveAdminProductCommand {
  constructor(
    private readonly productAdminRepository: ProductAdminRepository,
  ) {}

  async execute(productId: string, dto: ArchiveProductDto) {
    void dto;
    await this.productAdminRepository.archive(productId);
    return { message: 'Product archived successfully' };
  }
}

@Injectable()
export class RestoreAdminProductCommand {
  constructor(
    private readonly productAdminRepository: ProductAdminRepository,
  ) {}

  async execute(productId: string) {
    await this.productAdminRepository.restore(productId);
    return { message: 'Product restored successfully' };
  }
}
