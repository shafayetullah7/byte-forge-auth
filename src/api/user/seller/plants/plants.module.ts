import { Module } from '@nestjs/common';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { CreatePlantService } from './services/create-plant.service';
import { ListPlantsService } from './services/list-plants.service';
import { GetPlantByIdService } from './services/get-plant-by-id.service';
import { UpdatePlantService } from './services/update-plant.service';
import { UpdatePlantStatusService } from './services/update-plant-status.service';
import { DeletePlantService } from './services/delete-plant.service';
import { MediaRepositoryModule } from '@/_repositories/providers/media/media.repository/media.repository.module';
import { InventoryRepositoryModule } from '@/_repositories/business/inventory.repository/inventory.repository.module';
import { VerifiedUserAuthGuardModule } from '@/common/guards/verified-user-auth-guard/verified-user-auth.guard.module';
import { CatalogModule } from '@/modules/catalog/catalog.module';
import { ShopModule } from '@/modules/shop/shop.module';

@Module({
  controllers: [PlantsController],
  providers: [
    PlantsService,
    CreatePlantService,
    ListPlantsService,
    GetPlantByIdService,
    UpdatePlantService,
    UpdatePlantStatusService,
    DeletePlantService,
  ],
  imports: [
    MediaRepositoryModule,
    CatalogModule,
    InventoryRepositoryModule,
    VerifiedUserAuthGuardModule,
    ShopModule,
  ],
  exports: [PlantsService],
})
export class PlantsModule {}
