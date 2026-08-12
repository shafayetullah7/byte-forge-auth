import { Injectable } from '@nestjs/common';
import { mapDivision } from '../../mappers/location.mapper';
import { LocationRepository } from '../../repositories/location.repository';

@Injectable()
export class GetDivisionQuery {
  constructor(private readonly locationRepository: LocationRepository) {}

  async execute(id: string, lang: string = 'en') {
    const division =
      await this.locationRepository.findDivisionByIdWithDistricts(id);
    if (!division) {
      return null;
    }

    return mapDivision(division, lang);
  }
}
