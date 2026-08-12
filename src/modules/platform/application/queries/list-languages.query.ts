import { Injectable } from '@nestjs/common';
import { LanguageRepository } from '../../repositories';

@Injectable()
export class ListLanguagesQuery {
  constructor(private readonly languageRepository: LanguageRepository) {}

  execute() {
    return this.languageRepository.findAll();
  }
}
