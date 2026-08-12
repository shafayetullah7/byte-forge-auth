import { Injectable } from '@nestjs/common';
import { mapDivision } from '../../mappers/location.mapper';
import { LocationRepository } from '../../repositories/location.repository';

@Injectable()
export class ListDivisionsQuery {
  constructor(private readonly locationRepository: LocationRepository) {}

  async execute(lang: string = 'en') {
    const divisions =
      await this.locationRepository.findAllDivisionsWithDistricts();
    return divisions.map((division) => mapDivision(division, lang));
  }
}
