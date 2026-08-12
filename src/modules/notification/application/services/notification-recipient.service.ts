import { Injectable, Logger } from '@nestjs/common';
import { UserLocalAuthRepository } from '@/modules/auth/repositories/user-local-auth.repository';
import { ShopQueryService } from '@/modules/shop/application/queries';

export type ResolvedRecipient = {
  email: string;
  lang: string;
};

@Injectable()
export class NotificationRecipientService {
  private readonly logger = new Logger(NotificationRecipientService.name);

  constructor(
    private readonly userLocalAuthRepository: UserLocalAuthRepository,
    private readonly shopQueryService: ShopQueryService,
  ) {}

  async resolveBuyer(userId: string): Promise<ResolvedRecipient | null> {
    const auth = await this.userLocalAuthRepository.findOne({ userId });
    if (!auth?.email) {
      this.logger.warn(`No email found for buyer userId=${userId}`);
      return null;
    }
    return { email: auth.email, lang: 'en' };
  }

  async resolveShopOwner(shopId: string): Promise<ResolvedRecipient | null> {
    const shop = await this.shopQueryService.getShopById(shopId);
    if (!shop) {
      this.logger.warn(`Shop not found for shopId=${shopId}`);
      return null;
    }

    const ownerAuth = await this.userLocalAuthRepository.findOne({
      userId: shop.ownerId,
    });
    if (ownerAuth?.email) {
      return { email: ownerAuth.email, lang: 'en' };
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
