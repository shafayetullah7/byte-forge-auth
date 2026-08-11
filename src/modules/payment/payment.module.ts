import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { PaymentMethodRepository } from './repositories/payment-method.repository';
import { PaymentRepository } from './repositories/payment.repository';

/**
 * Payment domain module. Admin/public HTTP and checkout integration migrate in Phases 17–18.
 *
 * `PaymentRepository` is module-private. `PaymentMethodRepository` is exported temporarily
 * for legacy API modules until admin/public cutover.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [PaymentMethodRepository, PaymentRepository],
  exports: [PaymentMethodRepository],
})
export class PaymentModule {}
