import {
  Controller,
  Post,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartAccessGuard } from '@/common/guards/cart-access-guard/cart-access.guard';
import { CartContextParam } from '@/common/decorators/cart-context.decorator';
import { CartContext as CartContextType } from '@/common/types/cart-context.type';
import { ResponseService } from '@/common/modules/response/response.service';
import { OrderCartIntegration } from '@/common/integrations/order';
import {
  ApiAuth,
  ApiOkResponseTyped,
} from '@/common/decorators/swagger.decorators';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@/common/decorators/api-error.decorator';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { PlaceOrderCommand } from '../application/commands';
import { CalculatePriceBreakdownQuery } from '../application/queries/calculate-price-breakdown.query';
import { CalculatePriceBreakdownBodyDto } from './dto/calculate-price-breakdown-body.dto';
import { PlaceOrderBodyDto } from './dto/place-order-body.dto';
import { PriceBreakdownResponseDto } from './dto/price-breakdown-response.dto';
import { PlaceOrderResponseDto } from './dto/place-order-response.dto';

@ApiTags('💳 Checkout')
@Controller({ path: 'user/buyer/checkout', version: '1' })
export class BuyerCheckoutController {
  constructor(
    private readonly calculatePriceBreakdownQuery: CalculatePriceBreakdownQuery,
    private readonly placeOrderCommand: PlaceOrderCommand,
    private readonly responseService: ResponseService,
    private readonly i18n: I18nService,
    private readonly cartIntegration: OrderCartIntegration,
  ) {}

  @ApiAuth()
  @ApiOperation({
    summary: 'Calculate price breakdown',
    description:
      'Calculates the complete price breakdown for selected cart items including items subtotal, per-shop shipping costs, tax, and total based on the shipping address district.',
  })
  @ApiOkResponseTyped(
    PriceBreakdownResponseDto,
    'Price breakdown calculated successfully',
  )
  @ApiUnauthorizedResponse()
  @ApiBadRequestResponse(
    'Invalid address ID, empty itemIds, or validation failed',
  )
  @ApiNotFoundResponse('Cart not found')
  @Post('price-breakdown')
  @UseGuards(CartAccessGuard)
  async calculatePriceBreakdown(
    @Body() body: CalculatePriceBreakdownBodyDto,
    @CartContextParam() cartContext: CartContextType,
    @I18nLang() lang: string,
  ) {
    const resolved = await this.resolveCartContext(cartContext);
    const breakdown = await this.calculatePriceBreakdownQuery.executeByCartId(
      resolved.cartId,
      body.addressId,
      body.itemIds,
      lang,
    );

    return this.responseService.success({
      message: this.i18n.t('message.success.priceBreakdownCalculated', {
        lang,
      }),
      data: { breakdown },
    });
  }

  @ApiAuth()
  @ApiOperation({
    summary: 'Place order',
    description:
      'Creates orders for selected cart items with the specified payment method. Groups items by shop into separate orders under one order group.',
  })
  @ApiOkResponseTyped(PlaceOrderResponseDto, 'Order placed successfully')
  @ApiUnauthorizedResponse()
  @ApiBadRequestResponse(
    'Invalid request, insufficient stock, or unsupported payment method',
  )
  @ApiNotFoundResponse('Cart or address not found')
  @Post('place-order')
  @UseGuards(CartAccessGuard)
  async placeOrder(
    @Body() body: PlaceOrderBodyDto,
    @CartContextParam() cartContext: CartContextType,
    @I18nLang() lang: string,
  ) {
    if (!cartContext.userId) {
      throw new BadRequestException(
        'Guest checkout is not supported. Please sign in to place an order.',
      );
    }

    const resolved = await this.resolveCartContext(cartContext);

    const result = await this.placeOrderCommand.execute({
      cartId: resolved.cartId,
      userId: cartContext.userId,
      addressId: body.addressId,
      itemIds: body.itemIds,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      lang,
    });

    return this.responseService.success({
      message: this.i18n.t('message.success.orderPlaced', { lang }),
      data: { orderGroup: result },
    });
  }

  private async resolveCartContext(
    context: CartContextType,
  ): Promise<{ cartId: string }> {
    const { userId, guestToken } = context;

    if (userId) {
      const cart = await this.cartIntegration.getCartByUserId(userId);
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      return { cartId: cart.id };
    }

    if (guestToken) {
      const cart = await this.cartIntegration.getCartByGuestToken(guestToken);
      if (!cart) {
        throw new NotFoundException('Cart not found');
      }
      return { cartId: cart.id };
    }

    throw new NotFoundException('No valid cart context provided');
  }
}
