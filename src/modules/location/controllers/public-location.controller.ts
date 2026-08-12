import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { I18nLang } from 'nestjs-i18n';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import { ApiNotFoundResponse } from '@/libs/decorators/api-error.decorator';
import {
  GetDistrictQuery,
  GetDivisionQuery,
  ListDistrictsQuery,
  ListDivisionsQuery,
} from '../application/queries';
import { GetDistrictByIdParamsDto } from './dto/get-district-by-id-params.dto';
import { GetDivisionByIdParamsDto } from './dto/get-division-by-id-params.dto';

@ApiTags('📍 Public - Locations')
@Controller({ path: 'locations', version: '1' })
export class PublicLocationController {
  constructor(
    private readonly listDivisionsQuery: ListDivisionsQuery,
    private readonly getDivisionQuery: GetDivisionQuery,
    private readonly listDistrictsQuery: ListDistrictsQuery,
    private readonly getDistrictQuery: GetDistrictQuery,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Get all divisions with districts',
    description:
      'Returns all Bangladesh divisions with their districts, with translations',
  })
  @ApiResponse({ status: 200, description: 'Divisions retrieved successfully' })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['en', 'bn'],
    default: 'en',
    description: 'Response language',
  })
  @Get('divisions')
  async findAllDivisions(@I18nLang() lang: string) {
    const data = await this.listDivisionsQuery.execute(lang);
    return { success: true, message: 'Divisions retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get division by ID',
    description:
      'Returns a single division with its districts and translations',
  })
  @ApiResponse({ status: 200, description: 'Division retrieved successfully' })
  @ApiNotFoundResponse('Division not found')
  @ApiParam({ name: 'id', description: 'Division UUID' })
  @Get('divisions/:id')
  async findDivisionById(
    @Param() params: GetDivisionByIdParamsDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getDivisionQuery.execute(params.id, lang);
    if (!data) {
      throw new Error('Division not found');
    }
    return { success: true, message: 'Division retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get all districts',
    description: 'Returns all Bangladesh districts with translations',
  })
  @ApiResponse({ status: 200, description: 'Districts retrieved successfully' })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['en', 'bn'],
    default: 'en',
    description: 'Response language',
  })
  @Get('districts')
  async findAllDistricts(@I18nLang() lang: string) {
    const data = await this.listDistrictsQuery.execute(lang);
    return { success: true, message: 'Districts retrieved', data };
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Get district by ID',
    description: 'Returns a single district with translations',
  })
  @ApiResponse({ status: 200, description: 'District retrieved successfully' })
  @ApiNotFoundResponse('District not found')
  @ApiParam({ name: 'id', description: 'District UUID' })
  @Get('districts/:id')
  async findDistrictById(
    @Param() params: GetDistrictByIdParamsDto,
    @I18nLang() lang: string,
  ) {
    const data = await this.getDistrictQuery.execute(params.id, lang);
    if (!data) {
      throw new Error('District not found');
    }
    return { success: true, message: 'District retrieved', data };
  }
}
