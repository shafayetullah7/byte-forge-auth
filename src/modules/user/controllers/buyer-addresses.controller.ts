import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { AuthenticUser } from '@/common/decorators/authentic-user.decorator';
import {
  ApiAuth,
  ApiCreatedResponseTyped,
  ApiOkResponseTyped,
  ApiPaginatedResponse,
} from '@/common/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@/common/decorators/api-error.decorator';
import { UserAuthGuard } from '@/common/guards/user-auth-guard/user-auth.guard';
import { ResponseService } from '@/common/modules/response/response.service';
import { TAuthenticUser } from '@/common/types';
import {
  CreateAddressCommand,
  DeleteAddressCommand,
  SetDefaultAddressCommand,
  UpdateAddressCommand,
} from '../application/commands';
import { GetAddressByIdQuery, GetAddressesQuery } from '../application/queries';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressIdParamsDto } from './dto/address-params.dto';
import { AddressPaginationDto } from './dto/list-addresses-query.dto';
import { AddressResponseDto } from './response/address-response.dto';

@ApiTags('📍 User Addresses')
@Controller({ path: 'user/buyer/addresses', version: '1' })
@UseGuards(UserAuthGuard)
export class BuyerAddressesController {
  constructor(
    private readonly createAddressCommand: CreateAddressCommand,
    private readonly getAddressesQuery: GetAddressesQuery,
    private readonly getAddressByIdQuery: GetAddressByIdQuery,
    private readonly updateAddressCommand: UpdateAddressCommand,
    private readonly deleteAddressCommand: DeleteAddressCommand,
    private readonly setDefaultAddressCommand: SetDefaultAddressCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
  ) {}

  @ApiAuth()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiCreatedResponseTyped(AddressResponseDto, 'Address created successfully')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @Post()
  async create(
    @AuthenticUser() authUser: TAuthenticUser,
    @Body() dto: CreateAddressDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.createAddressCommand.execute(
      authUser.user.id,
      dto,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.addressCreated', { lang }),
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'List all addresses' })
  @ApiPaginatedResponse(AddressResponseDto)
  @ApiUnauthorizedResponse()
  @Get()
  async findAll(
    @AuthenticUser() authUser: TAuthenticUser,
    @Query() query: AddressPaginationDto,
    @I18nLang() lang: string,
  ) {
    const { addresses, total } = await this.getAddressesQuery.execute(
      authUser.user.id,
      lang,
      query,
    );

    return this.responseService.paginated({
      message: this.i18n.t('message.success.addressesRetrieved', { lang }),
      data: addresses,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
      },
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiOkResponseTyped(AddressResponseDto, 'Address retrieved successfully')
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Address')
  @Get(':id')
  async findById(
    @Param() params: AddressIdParamsDto,
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const result = await this.getAddressByIdQuery.execute(
      params.id,
      authUser.user.id,
      lang,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.addressRetrieved', { lang }),
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Update an address' })
  @ApiOkResponseTyped(AddressResponseDto, 'Address updated successfully')
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Address')
  @Patch(':id')
  async update(
    @Param() params: AddressIdParamsDto,
    @AuthenticUser() authUser: TAuthenticUser,
    @Body() dto: UpdateAddressDto,
    @I18nLang() lang: string,
  ) {
    const result = await this.updateAddressCommand.execute(
      params.id,
      authUser.user.id,
      dto,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.addressUpdated', { lang }),
      data: result,
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Delete an address' })
  @ApiOkResponse({ description: 'Address deleted successfully' })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Address')
  @Delete(':id')
  async delete(
    @Param() params: AddressIdParamsDto,
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    await this.deleteAddressCommand.execute(params.id, authUser.user.id);
    return this.responseService.success({
      message: this.i18n.t('message.success.addressDeleted', { lang }),
      data: {},
    });
  }

  @ApiAuth()
  @ApiOperation({ summary: 'Set address as default' })
  @ApiOkResponseTyped(AddressResponseDto, 'Default address set successfully')
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse('Address')
  @Patch(':id/default')
  async setDefault(
    @Param() params: AddressIdParamsDto,
    @AuthenticUser() authUser: TAuthenticUser,
    @I18nLang() lang: string,
  ) {
    const result = await this.setDefaultAddressCommand.execute(
      params.id,
      authUser.user.id,
    );
    return this.responseService.success({
      message: this.i18n.t('message.success.addressSetDefault', { lang }),
      data: result,
    });
  }
}
