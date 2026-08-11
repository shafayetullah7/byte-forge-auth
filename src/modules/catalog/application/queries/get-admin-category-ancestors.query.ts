import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

@Injectable()
export class GetAdminCategoryAncestorsQuery {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(id: string) {
    const category = await this.categoryRepository.findOne(id);
    if (!category) throw new NotFoundException(`Category ${id} not found.`);

    return this.categoryAdminRepository.listAncestors(id);
  }
}
