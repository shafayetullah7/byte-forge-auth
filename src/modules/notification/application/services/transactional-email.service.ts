import { Injectable } from '@nestjs/common';
import { AppEnvService } from '@/_config/app-env/app-env.service';
import { EmailService } from '@/common/modules/email/email.service';
import {
  LEGACY_TRANSACTIONAL_TEMPLATE_KEY_MAP,
  EmailTemplateId,
} from '@/common/modules/email/templates/types/email-template-id.enum';
import type {
  OrderPlacedEvent,
  OrderStatusChangedEvent,
  ShopVerificationDecidedEvent,
} from '@/common/modules/events/events';
import {
  resolveOrderEmailRecipient,
  resolveOrderEmailTemplateKey,
} from '../../utils/resolve-order-email-recipient.util';
import type { ResolvedRecipient } from './notification-recipient.service';

@Injectable()
export class TransactionalEmailService {
  constructor(
    private readonly emailService: EmailService,
    private readonly appEnv: AppEnvService,
  ) {}

  get frontendUrl(): string {
    return this.appEnv.FRONTEND_URL.replace(/\/$/, '');
  }

  async sendOrderPlacedBuyer(
    recipient: ResolvedRecipient,
    event: OrderPlacedEvent,
  ): Promise<void> {
    const { payload } = event;
    const orderList = payload.orders
      .map((o) => `• ${o.orderNumber} (${o.shopName}) — ৳${o.total}`)
      .join('\n');

    await this.sendTemplate(
      recipient.email,
      EmailTemplateId.ORDERS_PLACED_BUYER,
      {
        orderGroupId: payload.orderGroupId,
        totalAmount: payload.totalAmount,
        orderList,
        orderCount: String(payload.orders.length),
        viewOrdersUrl: `${this.frontendUrl}/app/orders`,
      },
    );
  }

  async sendOrderPlacedSeller(
    recipient: ResolvedRecipient,
    order: OrderPlacedEvent['payload']['orders'][number],
  ): Promise<void> {
    await this.sendTemplate(
      recipient.email,
      EmailTemplateId.ORDERS_PLACED_SELLER,
      {
        orderNumber: order.orderNumber,
        shopName: order.shopName,
        total: order.total,
        viewOrderUrl: `${this.frontendUrl}/app/seller/orders/${order.orderId}`,
      },
    );
  }

  async sendOrderStatusChanged(
    recipient: ResolvedRecipient,
    event: OrderStatusChangedEvent,
    templateKey: string,
  ): Promise<void> {
    const { payload } = event;
    const templateId = LEGACY_TRANSACTIONAL_TEMPLATE_KEY_MAP[templateKey];
    if (!templateId) return;

    const isSellerRecipient = resolveOrderEmailRecipient(payload) === 'seller';

    const viewOrderUrl = isSellerRecipient
      ? `${this.frontendUrl}/app/seller/orders/${payload.orderId}`
      : `${this.frontendUrl}/app/orders/${payload.orderId}`;

    await this.sendTemplate(recipient.email, templateId, {
      orderNumber: payload.orderNumber,
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus,
      notes: payload.notes ?? '',
      viewOrderUrl,
    });
  }

  async sendVerificationSubmitted(recipient: ResolvedRecipient): Promise<void> {
    await this.sendTemplate(
      recipient.email,
      EmailTemplateId.SHOP_VERIFICATION_SUBMITTED,
      {
        viewShopUrl: `${this.frontendUrl}/app/seller/my-shop`,
      },
    );
  }

  async sendVerificationDecided(
    recipient: ResolvedRecipient,
    event: ShopVerificationDecidedEvent,
  ): Promise<void> {
    const templateId =
      event.payload.decision === 'approved'
        ? EmailTemplateId.SHOP_VERIFICATION_APPROVED
        : EmailTemplateId.SHOP_VERIFICATION_REJECTED;

    await this.sendTemplate(recipient.email, templateId, {
      reason: event.payload.reason ?? '',
      viewShopUrl: `${this.frontendUrl}/app/seller/my-shop`,
      publicShopUrl: `${this.frontendUrl}/shops`,
    });
  }

  resolveOrderTemplateKey(event: OrderStatusChangedEvent): string | null {
    return resolveOrderEmailTemplateKey(event.payload);
  }

  private async sendTemplate(
    to: string,
    templateId: EmailTemplateId,
    args: Record<string, string>,
  ): Promise<void> {
    await this.emailService.sendTransactionalEmail(templateId, to, args);
  }
}
