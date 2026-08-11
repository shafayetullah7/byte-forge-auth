import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpsertTagGroupTranslationDto } from '../../controllers/dto/upsert-tag-group-translation.dto';
import { TagGroupAdminRepository } from '../../repositories/tag-group-admin.repository';
import { TagGroupRepository } from '../../repositories/tag-group.repository';

@Injectable()
export class UpsertTagGroupTranslationCommand {
  constructor(
    private readonly tagGroupRepository: TagGroupRepository,
    private readonly tagGroupAdminRepository: TagGroupAdminRepository,
  ) {}

  async execute(groupId: string, dto: UpsertTagGroupTranslationDto) {
    const group = await this.tagGroupRepository.findOne(groupId);
    if (!group) {
      throw new NotFoundException(`Tag Group with ID ${groupId} not found`);
    }

    const language = await this.tagGroupAdminRepository.findLanguageByCode(
      dto.locale,
    );
    if (!language) {
      throw new BadRequestException(
        `Language locale '${dto.locale}' is not supported`,
      );
    }

    return this.tagGroupAdminRepository.upsertTranslation(groupId, dto);
  }
}
