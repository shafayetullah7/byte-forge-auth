import { NotImplementedException } from '@nestjs/common';
import { WalletSubscriptionProvider } from './wallet-subscription.provider';

describe('WalletSubscriptionProvider (v2 stub)', () => {
  const provider = new WalletSubscriptionProvider();

  it('createCheckout throws NotImplementedException', async () => {
    await expect(
      provider.createCheckout({
        shopId: 'shop-1',
        planId: 'plan-1',
        amountBdt: 999,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  it('handleCallback throws NotImplementedException', async () => {
    await expect(
      provider.handleCallback({ rawBody: {}, headers: {} }),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });
});
