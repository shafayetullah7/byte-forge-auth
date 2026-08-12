import { Injectable } from '@nestjs/common';
import { mapDistrict } from '../../mappers/location.mapper';
import { LocationRepository } from '../../repositories/location.repository';

@Injectable()
export class ListDistrictsQuery {
  constructor(private readonly locationRepository: LocationRepository) {}

  async execute(lang: string = 'en') {
    const districts = await this.locationRepository.findAllDistricts();
    return districts.map((district) => mapDistrict(district, lang));
  }
}
