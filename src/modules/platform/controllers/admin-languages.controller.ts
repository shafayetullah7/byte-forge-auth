import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ResponseService } from '@/libs/modules/response/response.service';
import { AdminAuthGuard } from '@/libs/guards/admin-auth-guard/admin-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from '@/libs/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@/libs/decorators/api-error.decorator';
import {
  CreateLanguageCommand,
  UpdateLanguageCommand,
} from '../application/commands';
import { ListLanguagesQuery } from '../application/queries';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageCodeParamDto } from './dto/language-code-param.dto';

@ApiTags('🌍 Admin - Languages')
@UseGuards(AdminAuthGuard)
@ApiAuth()
@Controller('admin/languages')
export class AdminLanguagesController {
  constructor(
    private readonly listLanguagesQuery: ListLanguagesQuery,
    private readonly createLanguageCommand: CreateLanguageCommand,
    private readonly updateLanguageCommand: UpdateLanguageCommand,
    private readonly responseService: ResponseService,
  ) {}

  @ApiOperation({ summary: 'Get all languages' })
  @ApiResponse({ status: 200, description: 'Languages retrieved' })
  @Get()
  async findAll() {
    const data = await this.listLanguagesQuery.execute();
    return this.responseService.success({
      data,
      message: 'Languages retrieved successfully',
    });
  }

  @ApiOperation({ summary: 'Create a new language' })
  @ApiResponse({ status: 201, description: 'Language created' })
  @ApiBadRequestResponse()
  @Post()
  async create(@Body() createDto: CreateLanguageDto) {
    const data = await this.createLanguageCommand.execute(createDto);
    return this.responseService.success({
      data,
      message: 'Language created successfully',
    });
  }

  @ApiOperation({ summary: 'Update a language' })
  @ApiResponse({ status: 200, description: 'Language updated' })
  @ApiBadRequestResponse()
  @ApiNotFoundResponse('Language')
  @Patch(':code')
  async update(
    @Param() param: LanguageCodeParamDto,
    @Body() updateDto: UpdateLanguageDto,
  ) {
    const data = await this.updateLanguageCommand.execute(
      param.code,
      updateDto,
    );
    return this.responseService.success({
      data,
      message: 'Language updated successfully',
    });
  }
}
