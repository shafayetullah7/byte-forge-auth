import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  toPaymentMethodResponse,
  type PaymentMethodResponse,
} from '../../mappers/payment-method.mapper';
import { PaymentMethodRepository } from '../../repositories/payment-method.repository';
import type { UpdatePaymentMethodDto } from '../../controllers/dto/update-payment-method.dto';
import { PaymentMethodLogoService } from '../payment-method-logo.service';

@Injectable()
export class UpdatePaymentMethodCommand {
  constructor(
    private readonly repository: PaymentMethodRepository,
    private readonly logoService: PaymentMethodLogoService,
    private readonly db: DrizzleService,
  ) {}

  async execute(
    id: string,
    dto: UpdatePaymentMethodDto,
    adminId: string,
  ): Promise<PaymentMethodResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    if (
      dto.displayName === undefined &&
      dto.logoId === undefined &&
      dto.description === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    const updated = await this.db.client.transaction(async (tx) => {
      const nextLogoId = await this.logoService.applyLogoChange(
        existing.logoId,
        dto.logoId,
        adminId,
        tx,
      );

      return this.repository.update(
        id,
        {
          ...(dto.displayName !== undefined && {
            displayName: dto.displayName,
          }),
          ...(nextLogoId !== undefined && { logoId: nextLogoId }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
        },
        tx,
      );
    });

    if (!updated) {
      throw new NotFoundException(`Payment method '${id}' not found`);
    }

    return toPaymentMethodResponse(updated);
  }
}
