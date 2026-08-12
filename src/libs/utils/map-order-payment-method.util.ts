import type { TMedia } from '@/_db/drizzle/schema/media/media.schema';
import type { TPaymentMethod } from '@/_db/drizzle/enum/payment-method.enum';

export type PaymentMethodCatalogInput =
  | {
      key: string;
      displayName: string;
      logo?: TMedia | null;
    }
  | null
  | undefined;

export function mapOrderPaymentMethod(
  paymentMethod: TPaymentMethod | null,
  paymentMethodId: string | null,
  catalog?: PaymentMethodCatalogInput,
) {
  return {
    paymentMethod,
    paymentMethodId,
    paymentMethodKey: catalog?.key ?? paymentMethod,
    paymentMethodDisplayName: catalog?.displayName ?? null,
    paymentMethodLogoUrl: catalog?.logo?.url ?? null,
  };
}
