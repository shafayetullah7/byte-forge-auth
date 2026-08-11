import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpsertTagTranslationDto } from '../../controllers/dto/upsert-tag-translation.dto';
import { TagAdminRepository } from '../../repositories/tag-admin.repository';
import { TagRepository } from '../../repositories/tag.repository';

@Injectable()
export class UpsertTagTranslationCommand {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly tagAdminRepository: TagAdminRepository,
  ) {}

  async execute(tagId: string, dto: UpsertTagTranslationDto) {
    const tag = await this.tagRepository.findOne(tagId);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${tagId} not found`);
    }

    const language = await this.tagAdminRepository.findLanguageByCode(
      dto.locale,
    );
    if (!language) {
      throw new BadRequestException(
        `Language locale '${dto.locale}' is not supported`,
      );
    }

    return this.tagAdminRepository.upsertTranslation(tagId, dto);
  }
}
