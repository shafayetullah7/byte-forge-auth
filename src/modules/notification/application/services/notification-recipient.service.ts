import { Injectable, Logger } from '@nestjs/common';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { ShopQueryService } from '@/modules/shop/application/queries';

export type ResolvedRecipient = {
  email: string;
  lang: string;
};

@Injectable()
export class NotificationRecipientService {
  private readonly logger = new Logger(NotificationRecipientService.name);

  constructor(
    private readonly userQueryService: UserQueryService,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async resolveBuyer(userId: string): Promise<ResolvedRecipient | null> {
    const user = await this.userQueryService.findById(userId);
    if (!user?.email) {
      this.logger.warn(`No email found for buyer userId=${userId}`);
      return null;
    }
    return { email: user.email, lang: 'en' };
  }

  async resolveShopOwner(shopId: string): Promise<ResolvedRecipient | null> {
    const shop = await this.shopQueryService.getShopById(shopId);
    if (!shop) {
      this.logger.warn(`Shop not found for shopId=${shopId}`);
      return null;
    }

    const owner = await this.userQueryService.findById(shop.ownerId);
    if (owner?.email) {
      return { email: owner.email, lang: 'en' };
    }

    const contact = await this.shopQueryService.getShopContactByShopId(shopId);
    if (contact?.businessEmail) {
      return { email: contact.businessEmail, lang: 'en' };
    }

    this.logger.warn(
      `No email found for shop owner shopId=${shopId} ownerId=${shop.ownerId}`,
    );
    return null;
  }

  async resolveUser(userId: string): Promise<ResolvedRecipient | null> {
    return this.resolveBuyer(userId);
  }
}
