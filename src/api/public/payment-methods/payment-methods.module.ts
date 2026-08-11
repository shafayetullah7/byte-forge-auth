import { Module } from '@nestjs/common';
import { PaymentModule } from '@/modules/payment/payment.module';
import { PublicPaymentMethodsController } from './payment-methods.controller';
import { PublicPaymentMethodsService } from './payment-methods.service';

@Module({
  imports: [PaymentModule],
  controllers: [PublicPaymentMethodsController],
  providers: [PublicPaymentMethodsService],
  exports: [PublicPaymentMethodsService],
})
export class PublicPaymentMethodsModule {}
