import { Injectable } from '@nestjs/common';
import { mapDistrict } from '../../mappers/location.mapper';
import { LocationRepository } from '../../repositories/location.repository';

@Injectable()
export class GetDistrictQuery {
  constructor(private readonly locationRepository: LocationRepository) {}

  async execute(id: string, lang: string = 'en') {
    const district = await this.locationRepository.findDistrictById(id);
    if (!district) {
      return null;
    }

    return mapDistrict(district, lang);
  }
}
