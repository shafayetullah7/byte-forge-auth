import { Injectable, HttpStatus } from '@nestjs/common';
import { CreatePlantDto } from './dto/create-plant.dto';
import { ListPlantsQueryDto } from './dto/list-plants-query.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { UpdatePlantStatusDto } from './dto/update-plant-status.dto';
import {
  assertNoStockFieldsOnUpdate,
  isStatusOnlyPlantUpdate,
} from './dto/update-plant.dto';
import { CreatePlantService } from './services/create-plant.service';
import { ListPlantsService } from './services/list-plants.service';
import { GetPlantByIdService } from './services/get-plant-by-id.service';
import { UpdatePlantService } from './services/update-plant.service';
import { UpdatePlantStatusService } from './services/update-plant-status.service';
import { DeletePlantService } from './services/delete-plant.service';
import { ShopQueryService } from '@/modules/shop/application/queries';
import { I18nService } from 'nestjs-i18n';
import { CustomException } from '@/common/exceptions/custom.exception';
import { ErrorCode } from '@/common/modules/response/dto/error.schema';
import { TProductStatus } from '@/_db/drizzle/enum';

@Injectable()
export class PlantsService {
  constructor(
    private readonly createPlantService: CreatePlantService,
    private readonly listPlantsService: ListPlantsService,
    private readonly getPlantByIdService: GetPlantByIdService,
    private readonly updatePlantService: UpdatePlantService,
    private readonly updatePlantStatusService: UpdatePlantStatusService,
    private readonly deletePlantService: DeletePlantService,
    private readonly shopQueryService: ShopQueryService,
    private readonly i18n: I18nService,
  ) {}

  async createPlant(userId: string, dto: CreatePlantDto, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    return this.createPlantService.execute(shop.id, userId, dto, lang);
  }

  async getPlants(userId: string, query: ListPlantsQueryDto, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    return this.listPlantsService.execute(shop.id, query, lang);
  }

  async getPlantById(userId: string, plantId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    const plant = await this.getPlantByIdService.execute(shop.id, plantId);

    if (!plant) {
      throw new CustomException({
        message: this.i18n.t('message.error.plantNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return plant;
  }

  async updatePlant(
    userId: string,
    plantId: string,
    body: Record<string, unknown>,
    lang: string,
  ) {
    this.guardAgainstStockFieldsOnUpdate(body, lang);

    const shop = await this.resolveShop(userId, lang);

    if (isStatusOnlyPlantUpdate(body)) {
      const statusDto = body as unknown as UpdatePlantStatusDto;
      return this.updatePlantStatusService.execute(
        shop.id,
        plantId,
        statusDto.status as TProductStatus,
        lang,
      );
    }

    return this.updatePlantService.execute(
      shop.id,
      userId,
      plantId,
      body as unknown as UpdatePlantDto,
      lang,
    );
  }

  async deletePlant(userId: string, plantId: string, lang: string) {
    const shop = await this.resolveShop(userId, lang);
    return this.deletePlantService.execute(shop.id, plantId, lang);
  }

  private guardAgainstStockFieldsOnUpdate(body: unknown, lang: string): void {
    try {
      assertNoStockFieldsOnUpdate(body);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('STOCK_FIELD:')) {
        throw new CustomException({
          message: this.i18n.t(
            'message.error.stockFieldNotAllowedOnCatalogUpdate',
            { lang },
          ),
          statusCode: HttpStatus.BAD_REQUEST,
          errorCode: ErrorCode.VALIDATION_ERROR,
        });
      }
      throw error;
    }
  }

  private async resolveShop(userId: string, lang: string) {
    const shop = await this.shopQueryService.getShopByOwnerId(userId);

    if (!shop) {
      throw new CustomException({
        message: this.i18n.t('message.error.shopNotFound', { lang }),
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ErrorCode.NOT_FOUND,
      });
    }

    return shop;
  }
}
