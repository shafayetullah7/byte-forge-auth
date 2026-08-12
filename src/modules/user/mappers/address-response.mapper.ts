import { resolveTranslation } from '@/common/utils/resolve-translation.util';
import { AddressResponseDto } from '../controllers/response/address-response.dto';

type AddressRow = {
  id: string;
  type: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  districtId: string;
  divisionId: string;
  postalCode: string | null;
  country: string;
  companyName: string | null;
  deliveryInstructions: string | null;
  billingNotes: string | null;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  district: {
    translations: Array<{ locale: string; name: string }>;
  } | null;
  division: {
    translations: Array<{ locale: string; name: string }>;
  } | null;
};

export function mapAddressToResponse(
  row: AddressRow,
  locale: string,
): AddressResponseDto {
  const districtTranslation = resolveTranslation(
    row.district?.translations,
    locale,
  );
  const divisionTranslation = resolveTranslation(
    row.division?.translations,
    locale,
  );

  const createdAt = row.createdAt;
  const updatedAt = row.updatedAt;

  return {
    id: row.id,
    type: row.type,
    label: row.label,
    recipientName: row.recipientName,
    phone: row.phone,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2 ?? null,
    districtId: row.districtId,
    divisionId: row.divisionId,
    city: districtTranslation?.name ?? '',
    state: divisionTranslation?.name ?? null,
    postalCode: row.postalCode ?? null,
    country: row.country,
    companyName: row.companyName ?? null,
    deliveryInstructions: row.deliveryInstructions ?? null,
    billingNotes: row.billingNotes ?? null,
    isDefault: row.isDefault,
    createdAt:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    updatedAt:
      updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
  };
}
