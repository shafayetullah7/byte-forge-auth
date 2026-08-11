import type { CartRepository } from './cart.repository';

export type CartVariantForOperation = NonNullable<
  Awaited<ReturnType<CartRepository['getVariantForCartOperation']>>
>;
