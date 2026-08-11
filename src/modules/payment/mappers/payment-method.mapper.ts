import type { PaymentMethodWithLogo } from '@/_db/drizzle/schema/payment/payment-methods.schema';
import { PaymentMethodEnum } from '@/_db/drizzle/enum/payment-method.enum';

export interface PaymentMethodResponse {
  id: string;
  key: string;
  displayName: string;
  logoId: string | null;
  logoUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPaymentMethodResponse {
  id: string;
  key: string;
  displayName: string;
  logoId: string | null;
  logoUrl: string | null;
  description: string | null;
}

export function toPaymentMethodResponse(
  row: PaymentMethodWithLogo,
): PaymentMethodResponse {
  return {
    id: row.id,
    key: row.key,
    displayName: row.displayName,
    logoId: row.logoId ?? null,
    logoUrl: row.logoUrl ?? null,
    status: row.status,
    description: row.description ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPublicPaymentMethodResponse(
  row: PaymentMethodWithLogo,
): PublicPaymentMethodResponse {
  return {
    id: row.id,
    key: row.key,
    displayName: row.displayName,
    logoId: row.logoId ?? null,
    logoUrl: row.logoUrl ?? null,
    description: row.description ?? null,
  };
}

export const PAYMENT_METHOD_KEYS = Object.values(PaymentMethodEnum);
