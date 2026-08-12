import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  NotificationEventNames,
  OrderPlacedEvent,
  OrderStatusChangedEvent,
  ShopVerificationDecidedEvent,
  ShopVerificationSubmittedEvent,
} from '@/common/modules/events/events';
import { NotificationRecipientService } from '../services/notification-recipient.service';
import { TransactionalEmailService } from '../services/transactional-email.service';
import { resolveOrderEmailRecipient } from '../../utils/resolve-order-email-recipient.util';

@Injectable()
export class TransactionalEmailListener {
  private readonly logger = new Logger(TransactionalEmailListener.name);

  constructor(
    private readonly recipientService: NotificationRecipientService,
    private readonly transactionalEmailService: TransactionalEmailService,
  ) {}

  @OnEvent(NotificationEventNames.ORDER_PLACED)
  async handleOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    try {
      const buyer = await this.recipientService.resolveBuyer(
        event.payload.buyerUserId,
      );
      if (buyer) {
        await this.transactionalEmailService.sendOrderPlacedBuyer(buyer, event);
      }

      for (const order of event.payload.orders) {
        const seller = await this.recipientService.resolveShopOwner(
          order.shopId,
        );
        if (seller) {
          await this.transactionalEmailService.sendOrderPlacedSeller(
            seller,
            order,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to send order placed emails for group ${event.payload.orderGroupId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NotificationEventNames.ORDER_STATUS_CHANGED)
  async handleOrderStatusChanged(
    event: OrderStatusChangedEvent,
  ): Promise<void> {
    try {
      const recipientRole = resolveOrderEmailRecipient(event.payload);
      if (!recipientRole) return;

      const templateKey =
        this.transactionalEmailService.resolveOrderTemplateKey(event);
      if (!templateKey) return;

      const recipient =
        recipientRole === 'buyer'
          ? await this.recipientService.resolveBuyer(event.payload.buyerUserId)
          : await this.recipientService.resolveShopOwner(event.payload.shopId);

      if (!recipient) return;

      await this.transactionalEmailService.sendOrderStatusChanged(
        recipient,
        event,
        templateKey,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order status email for order ${event.payload.orderId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NotificationEventNames.SHOP_VERIFICATION_SUBMITTED)
  async handleVerificationSubmitted(
    event: ShopVerificationSubmittedEvent,
  ): Promise<void> {
    try {
      const recipient = await this.recipientService.resolveUser(
        event.payload.ownerId,
      );
      if (!recipient) return;
      await this.transactionalEmailService.sendVerificationSubmitted(recipient);
    } catch (error) {
      this.logger.error(
        `Failed to send verification submitted email for shop ${event.payload.shopId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NotificationEventNames.SHOP_VERIFICATION_DECIDED)
  async handleVerificationDecided(
    event: ShopVerificationDecidedEvent,
  ): Promise<void> {
    try {
      const recipient = await this.recipientService.resolveUser(
        event.payload.ownerId,
      );
      if (!recipient) return;
      await this.transactionalEmailService.sendVerificationDecided(
        recipient,
        event,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification decided email for shop ${event.payload.shopId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
