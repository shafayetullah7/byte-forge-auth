import Stripe from 'stripe';

type StripeConstructor = typeof Stripe;

/**
 * Stripe v22 + Nest (CommonJS) interop: `import Stripe from 'stripe'` compiles to
 * `new stripe_1.default()`, but the package exports the constructor on module.exports.
 */
function loadStripeConstructor(): StripeConstructor {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const stripeModule = require('stripe') as StripeConstructor | { default: StripeConstructor };

  if (typeof stripeModule === 'function') {
    return stripeModule;
  }

  if (stripeModule && typeof stripeModule.default === 'function') {
    return stripeModule.default;
  }

  throw new Error('Unable to load Stripe SDK constructor');
}

const StripeConstructor = loadStripeConstructor();

export function createStripeClient(apiKey: string): Stripe {
  return new StripeConstructor(apiKey, { typescript: true });
}

export function constructStripeWebhookEvent(
  payload: Buffer,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  return StripeConstructor.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret,
  );
}

export type { Stripe };
