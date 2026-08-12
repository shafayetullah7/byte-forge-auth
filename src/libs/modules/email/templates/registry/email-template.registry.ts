import { EmailTemplateId } from '../types/email-template-id.enum';
import type { EmailTemplate } from '../types/email-template.types';
import { accountVerificationTemplate } from '../auth/account-verification.template';
import { passwordResetTemplate } from '../auth/password-reset.template';
import { orderPlacedBuyerTemplate } from '../orders/order-placed-buyer.template';
import { orderPlacedSellerTemplate } from '../orders/order-placed-seller.template';
import { orderAcceptedTemplate } from '../orders/order-accepted.template';
import { orderPackedTemplate } from '../orders/order-packed.template';
import { orderShippedTemplate } from '../orders/order-shipped.template';
import { orderDeliveredTemplate } from '../orders/order-delivered.template';
import { orderDeliveryConfirmedSellerTemplate } from '../orders/order-delivery-confirmed-seller.template';
import { orderCompletedTemplate } from '../orders/order-completed.template';
import { orderCancelledByBuyerTemplate } from '../orders/order-cancelled-by-buyer.template';
import { orderCancelledBySellerTemplate } from '../orders/order-cancelled-by-seller.template';
import { shopVerificationSubmittedTemplate } from '../shop/shop-verification-submitted.template';
import { shopVerificationApprovedTemplate } from '../shop/shop-verification-approved.template';
import { shopVerificationRejectedTemplate } from '../shop/shop-verification-rejected.template';

const ALL_TEMPLATES: EmailTemplate[] = [
  accountVerificationTemplate,
  passwordResetTemplate,
  orderPlacedBuyerTemplate,
  orderPlacedSellerTemplate,
  orderAcceptedTemplate,
  orderPackedTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
  orderDeliveryConfirmedSellerTemplate,
  orderCompletedTemplate,
  orderCancelledByBuyerTemplate,
  orderCancelledBySellerTemplate,
  shopVerificationSubmittedTemplate,
  shopVerificationApprovedTemplate,
  shopVerificationRejectedTemplate,
];

class EmailTemplateRegistry {
  private readonly templates = new Map<EmailTemplateId, EmailTemplate>();

  constructor() {
    for (const template of ALL_TEMPLATES) {
      if (this.templates.has(template.id)) {
        throw new Error(
          `Duplicate email template registration: ${template.id}`,
        );
      }
      this.templates.set(template.id, template);
    }
  }

  get(id: EmailTemplateId): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  getAllIds(): EmailTemplateId[] {
    return [...this.templates.keys()];
  }
}

export const emailTemplateRegistry = new EmailTemplateRegistry();
