import { BadRequestException, Injectable } from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { StripeSubscriptionProvider } from '../../infrastructure/providers/stripe-subscription.provider';
import {
  toSellerBillingPortalResponse,
  type SellerBillingPortalResponse,
} from '../../mappers/seller-billing-portal.mapper';
import { ShopSubscriptionRepository } from '../../repositories/shop-subscription.repository';

@Injectable()
export class CreateSellerBillingPortalSessionCommand {
  constructor(
    private readonly shopSubscriptionRepository: ShopSubscriptionRepository,
    private readonly stripeSubscriptionProvider: StripeSubscriptionProvider,
  ) {}

  async execute(shopId: string): Promise<SellerBillingPortalResponse> {
    const subscription =
      await this.shopSubscriptionRepository.findByShopId(shopId);

    if (!subscription?.stripeCustomerId) {
      if (subscription?.billingProvider === SubscriptionBillingProviderEnum.COUPON) {
        throw new BadRequestException(
          'Billing portal is only available for Stripe subscriptions. Your shop is on a coupon plan.',
        );
      }

      if (subscription?.billingProvider === SubscriptionBillingProviderEnum.ADMIN) {
        throw new BadRequestException(
          'Billing portal is only available for Stripe subscriptions. Contact support for admin-managed plans.',
        );
      }

      throw new BadRequestException(
        'Billing portal requires an active Stripe subscription. Subscribe via Stripe checkout first.',
      );
    }

    const session = await this.stripeSubscriptionProvider.createBillingPortalSession(
      subscription.stripeCustomerId,
    );

    return toSellerBillingPortalResponse(session.url);
  }
}
