import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';

@Injectable()
export class DeleteTagTranslationCommand {
  constructor(private readonly tagAdminRepository: TagAdminRepository) {}

  async execute(tagId: string, locale: string) {
    if (locale === 'en' || locale === 'bn') {
      throw new BadRequestException(
        `Deleting the mandatory '${locale}' locale is not permitted.`,
      );
    }

    const result = await this.tagAdminRepository.deleteTranslation(
      tagId,
      locale,
    );

    if (result.length === 0) {
      throw new NotFoundException(
        `Translation for locale '${locale}' on tag '${tagId}' not found`,
      );
    }
  }
}
