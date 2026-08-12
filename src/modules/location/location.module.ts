import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import {
  GetDistrictQuery,
  GetDivisionQuery,
  ListDistrictsQuery,
  ListDivisionsQuery,
} from './application/queries';
import { PublicLocationController } from './controllers';
import { LocationRepository } from './repositories';

@Module({
  imports: [DrizzleModule],
  controllers: [PublicLocationController],
  providers: [
    LocationRepository,
    ListDivisionsQuery,
    GetDivisionQuery,
    ListDistrictsQuery,
    GetDistrictQuery,
  ],
})
export class LocationModule {}
