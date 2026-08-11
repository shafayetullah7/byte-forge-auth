import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';

@Injectable()
export class DeleteTagGroupTranslationCommand {
  constructor(
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(groupId: string, locale: string) {
    if (locale === 'en' || locale === 'bn') {
      throw new BadRequestException(
        `Deleting the mandatory '${locale}' locale is not permitted.`,
      );
    }

    const result = await this.tagGroupAdminRepository.deleteTranslation(
      groupId,
      locale,
    );

    if (result.length === 0) {
      throw new NotFoundException(
        `Translation for locale '${locale}' on group '${groupId}' not found`,
      );
    }
  }
}
