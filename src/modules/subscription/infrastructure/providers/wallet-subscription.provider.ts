import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  IWalletSubscriptionProvider,
  WalletSubscriptionCallbackInput,
  WalletSubscriptionCallbackResult,
  WalletSubscriptionCheckoutInput,
  WalletSubscriptionCheckoutResult,
} from './wallet-subscription.provider.interface';

/**
 * v2 placeholder — registered in DI for future SSLCommerz / bKash / Nagad adapters.
 * Not used by any v1 command or controller.
 */
@Injectable()
export class WalletSubscriptionProvider implements IWalletSubscriptionProvider {
  async createCheckout(
    _input: WalletSubscriptionCheckoutInput,
  ): Promise<WalletSubscriptionCheckoutResult> {
    throw new NotImplementedException(
      'Wallet subscription checkout is not available in v1. Use Stripe checkout or redeem a coupon.',
    );
  }

  async handleCallback(
    _input: WalletSubscriptionCallbackInput,
  ): Promise<WalletSubscriptionCallbackResult> {
    throw new NotImplementedException(
      'Wallet subscription callbacks are not available in v1.',
    );
  }
}
