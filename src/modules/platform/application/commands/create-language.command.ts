import { BadRequestException, Injectable } from '@nestjs/common';
import type { CreateLanguageDto } from '../../controllers/dto/create-language.dto';
import { LanguageRepository } from '../../repositories';

@Injectable()
export class CreateLanguageCommand {
  constructor(private readonly languageRepository: LanguageRepository) {}

  async execute(dto: CreateLanguageDto) {
    const existing = await this.languageRepository.findByCode(dto.code);

    if (existing) {
      throw new BadRequestException(
        `Language code '${dto.code}' already exists`,
      );
    }

    return this.languageRepository.create(dto);
  }
}
