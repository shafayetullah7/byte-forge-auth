import { eq } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  paymentTable,
  TNewPayment,
  TPayment,
} from '@/_db/drizzle/schema/payment/payments.schema';
import type { DrizzleTx } from '@/libs/db/types';
import { Payment } from '../domain/payment.entity';
import {
  mapPaymentEntityToUpdatePatch,
  mapPaymentRowToEntity,
} from './payment.repository.mapper';

@Injectable()
export class PaymentRepository {
  constructor(private readonly db: DrizzleService) {}

  async findById(id: string, tx?: DrizzleTx): Promise<Payment | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(paymentTable)
      .where(eq(paymentTable.id, id))
      .limit(1)
      .execute();

    return row ? mapPaymentRowToEntity(row) : null;
  }

  async findByOrderId(
    orderId: string,
    tx?: DrizzleTx,
  ): Promise<Payment | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(paymentTable)
      .where(eq(paymentTable.orderId, orderId))
      .limit(1)
      .execute();

    return row ? mapPaymentRowToEntity(row) : null;
  }

  async create(data: TNewPayment, tx?: DrizzleTx): Promise<Payment> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .insert(paymentTable)
      .values(data)
      .returning()
      .execute();

    return mapPaymentRowToEntity(row);
  }

  async update(payment: Payment, tx?: DrizzleTx): Promise<Payment> {
    const executor = this.db.getExecutor(tx);
    const patch = mapPaymentEntityToUpdatePatch(payment);
    const [row] = await executor
      .update(paymentTable)
      .set(patch)
      .where(eq(paymentTable.id, payment.id))
      .returning()
      .execute();

    return mapPaymentRowToEntity(row);
  }

  async findRowByOrderId(
    orderId: string,
    tx?: DrizzleTx,
  ): Promise<TPayment | null> {
    const executor = this.db.getExecutor(tx);
    const [row] = await executor
      .select()
      .from(paymentTable)
      .where(eq(paymentTable.orderId, orderId))
      .limit(1)
      .execute();

    return row ?? null;
  }
}
