import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../../repositories/category.repository';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

@Injectable()
export class ListCategoryTranslationsQuery {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(categoryId: string) {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.categoryAdminRepository.listTranslations(categoryId);
  }
}
