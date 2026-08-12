import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateLanguageDto } from '../../controllers/dto/update-language.dto';
import { LanguageRepository } from '../../repositories';

@Injectable()
export class UpdateLanguageCommand {
  constructor(private readonly languageRepository: LanguageRepository) {}

  async execute(code: string, dto: UpdateLanguageDto) {
    const existing = await this.languageRepository.findByCode(code);

    if (!existing) {
      throw new NotFoundException(`Language code '${code}' not found`);
    }

    return this.languageRepository.update(code, dto);
  }
}
