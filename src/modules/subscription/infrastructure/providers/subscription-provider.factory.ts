import { Injectable } from '@nestjs/common';
import { SubscriptionBillingProviderEnum } from '@/_db/drizzle/enum/subscription-billing-provider.enum';
import { StripeSubscriptionProvider } from './stripe-subscription.provider';
import type { IWalletSubscriptionProvider } from './wallet-subscription.provider.interface';
import { WalletSubscriptionProvider } from './wallet-subscription.provider';

/**
 * Registry for subscription billing adapters.
 *
 * v1 seller checkout uses `StripeSubscriptionProvider` directly in commands.
 * This factory exposes wallet/stripe providers for v2 wiring without changing
 * command signatures prematurely.
 */
@Injectable()
export class SubscriptionProviderFactory {
  constructor(
    private readonly stripeSubscriptionProvider: StripeSubscriptionProvider,
    private readonly walletSubscriptionProvider: WalletSubscriptionProvider,
  ) {}

  stripe(): StripeSubscriptionProvider {
    return this.stripeSubscriptionProvider;
  }

  wallet(): IWalletSubscriptionProvider {
    return this.walletSubscriptionProvider;
  }

  /**
   * Returns the wallet adapter when billing provider is WALLET; otherwise null.
   * v1 always returns null — no seller route selects WALLET checkout yet.
   */
  forBillingProvider(
    provider: (typeof SubscriptionBillingProviderEnum)[keyof typeof SubscriptionBillingProviderEnum],
  ): IWalletSubscriptionProvider | null {
    if (provider === SubscriptionBillingProviderEnum.WALLET) {
      return this.walletSubscriptionProvider;
    }
    return null;
  }
}
