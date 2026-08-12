import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';

export function assertEditableCampaignStatus(status: string) {
  return (
    status === ShopContentModerationStatusEnum.DRAFT ||
    status === ShopContentModerationStatusEnum.REJECTED
  );
}

export function assertDeletableCampaignStatus(status: string) {
  return status !== ShopContentModerationStatusEnum.APPROVED;
}
