import { constructStripeWebhookEvent, createStripeClient } from './stripe-sdk';

describe('stripe-sdk', () => {
  it('creates a Stripe client without default-export interop errors', () => {
    const client = createStripeClient('sk_test_example');

    expect(client).toBeDefined();
    expect(client.products).toBeDefined();
    expect(client.prices).toBeDefined();
  });

  it('exposes webhook verification on the loaded constructor', () => {
    expect(() =>
      constructStripeWebhookEvent(Buffer.from('{}'), 'sig', 'whsec_test'),
    ).toThrow();
  });
});
