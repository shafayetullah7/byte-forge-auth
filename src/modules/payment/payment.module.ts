import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { MediaModule } from '@/modules/media/media.module';
import {
  ActivatePaymentMethodCommand,
  CreatePaymentMethodCommand,
  DeactivatePaymentMethodCommand,
  UpdatePaymentMethodCommand,
} from './application/commands';
import { PaymentMethodLogoService } from './application/payment-method-logo.service';
import {
  GetPaymentMethodQuery,
  ListActivePaymentMethodsQuery,
  ListPaymentMethodsQuery,
  PaymentQueryService,
} from './application/queries';
import {
  AdminPaymentMethodsController,
  PublicPaymentMethodsController,
} from './controllers';
import { PaymentMethodRepository } from './repositories/payment-method.repository';
import { PaymentRepository } from './repositories/payment.repository';

@Module({
  imports: [DrizzleModule, MediaModule],
  controllers: [AdminPaymentMethodsController, PublicPaymentMethodsController],
  providers: [
    PaymentMethodRepository,
    PaymentRepository,
    PaymentMethodLogoService,
    ListPaymentMethodsQuery,
    GetPaymentMethodQuery,
    ListActivePaymentMethodsQuery,
    PaymentQueryService,
    CreatePaymentMethodCommand,
    UpdatePaymentMethodCommand,
    ActivatePaymentMethodCommand,
    DeactivatePaymentMethodCommand,
  ],
  exports: [
    ListPaymentMethodsQuery,
    GetPaymentMethodQuery,
    ListActivePaymentMethodsQuery,
    PaymentQueryService,
    CreatePaymentMethodCommand,
    UpdatePaymentMethodCommand,
    ActivatePaymentMethodCommand,
    DeactivatePaymentMethodCommand,
  ],
})
export class PaymentModule {}
