import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpsertCategoryTranslationDto } from '../../controllers/dto/upsert-category-translation.dto';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';
import { CategoryRepository } from '../../repositories/category.repository';

@Injectable()
export class UpsertCategoryTranslationCommand {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(categoryId: string, dto: UpsertCategoryTranslationDto) {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    return this.categoryAdminRepository.upsertTranslation(categoryId, dto);
  }
}
