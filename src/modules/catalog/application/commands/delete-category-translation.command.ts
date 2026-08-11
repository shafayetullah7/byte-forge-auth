import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryAdminRepository } from '../../repositories/category-admin.repository';

@Injectable()
export class DeleteCategoryTranslationCommand {
  constructor(
    private readonly categoryAdminRepository: CategoryAdminRepository,
  ) {}

  async execute(categoryId: string, locale: string) {
    if (locale === 'en') {
      throw new BadRequestException(
        "The base English ('en') translation cannot be deleted.",
      );
    }

    const result = await this.categoryAdminRepository.deleteTranslation(
      categoryId,
      locale,
    );

    if (result.length === 0) {
      throw new NotFoundException(
        `Translation for locale '${locale}' not found for category ${categoryId}`,
      );
    }
  }
}
