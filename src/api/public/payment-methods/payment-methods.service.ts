import { Injectable } from '@nestjs/common';
import { PaymentMethodRepository } from '@/modules/payment/repositories';

export interface PublicPaymentMethodResponse {
  id: string;
  key: string;
  displayName: string;
  logoId: string | null;
  logoUrl: string | null;
  description: string | null;
}

@Injectable()
export class PublicPaymentMethodsService {
  constructor(
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async findActive(): Promise<PublicPaymentMethodResponse[]> {
    const rows = await this.paymentMethodRepository.findAll({
      status: 'ACTIVE',
    });

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      displayName: row.displayName,
      logoId: row.logoId ?? null,
      logoUrl: row.logoUrl ?? null,
      description: row.description ?? null,
    }));
  }
}
