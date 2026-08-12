export class AddressResponseDto {
  id: string;
  type: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  districtId: string;
  divisionId: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  companyName: string | null;
  deliveryInstructions: string | null;
  billingNotes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
