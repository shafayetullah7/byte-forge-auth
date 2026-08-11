import { Module } from '@nestjs/common';
import { PaymentMethodsController } from './payment-methods.controller';
import { ListPaymentMethodsService } from './services/list-payment-methods.service';
import { GetPaymentMethodService } from './services/get-payment-method.service';
import { CreatePaymentMethodService } from './services/create-payment-method.service';
import { UpdatePaymentMethodService } from './services/update-payment-method.service';
import { ActivatePaymentMethodService } from './services/activate-payment-method.service';
import { DeactivatePaymentMethodService } from './services/deactivate-payment-method.service';
import { PaymentModule } from '@/modules/payment/payment.module';
import { MediaRepositoryModule } from '@/_repositories/providers/media/media.repository/media.repository.module';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { PaymentMethodLogoService } from './services/payment-method-logo.service';

@Module({
  imports: [PaymentModule, MediaRepositoryModule, DrizzleModule],
  controllers: [PaymentMethodsController],
  providers: [
    ListPaymentMethodsService,
    GetPaymentMethodService,
    CreatePaymentMethodService,
    UpdatePaymentMethodService,
    ActivatePaymentMethodService,
    DeactivatePaymentMethodService,
    PaymentMethodLogoService,
  ],
})
export class PaymentMethodsModule {}
