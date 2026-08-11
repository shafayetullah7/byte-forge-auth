import { BadRequestException, Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  toPaymentMethodResponse,
  type PaymentMethodResponse,
} from '../../mappers/payment-method.mapper';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';
import type { CreatePaymentMethodDto } from '../../controllers/dto/create-payment-method.dto';
import { PaymentMethodLogoService } from '../payment-method-logo.service';

@Injectable()
export class CreatePaymentMethodCommand {
  constructor(
    private readonly repository: PaymentMethodRepository,
    private readonly logoService: PaymentMethodLogoService,
    private readonly db: DrizzleService,
  ) {}

  async execute(
    dto: CreatePaymentMethodDto,
    adminId: string,
  ): Promise<PaymentMethodResponse> {
    const existing = await this.repository.findByKey(dto.key);

    if (existing) {
      throw new BadRequestException(
        `Payment method with key '${dto.key}' already exists`,
      );
    }

    const row = await this.db.client.transaction(async (tx) => {
      const logoId = await this.logoService.applyLogoChange(
        null,
        dto.logoId ?? null,
        adminId,
        tx,
      );

      return this.repository.create(
        {
          key: dto.key,
          displayName: dto.displayName,
          logoId: logoId ?? null,
          description: dto.description ?? null,
          status: 'INACTIVE',
        },
        tx,
      );
    });

    return toPaymentMethodResponse(row);
  }
}
