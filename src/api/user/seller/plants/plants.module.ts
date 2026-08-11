import { Module } from '@nestjs/common';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { ListPlantsService } from './services/list-plants.service';
import { GetPlantByIdService } from './services/get-plant-by-id.service';
import { UpdatePlantStatusService } from './services/update-plant-status.service';
import { DeletePlantService } from './services/delete-plant.service';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { ShopModule } from '@/modules/shop/shop.module';

@Module({
  controllers: [PlantsController],
  providers: [
    PlantsService,
    ListPlantsService,
    GetPlantByIdService,
    UpdatePlantStatusService,
    DeletePlantService,
  ],
  imports: [CatalogModule, VerifiedUserAuthGuardModule, ShopModule],
  exports: [PlantsService],
})
export class PlantsModule {}
