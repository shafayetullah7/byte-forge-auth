import { ShopContentModerationStatusEnum } from '@/_db/drizzle/enum';

export function assertEditableArticleStatus(status: string) {
  return (
    status === ShopContentModerationStatusEnum.DRAFT ||
    status === ShopContentModerationStatusEnum.REJECTED
  );
}

export function assertDeletableArticleStatus(status: string) {
  return status !== ShopContentModerationStatusEnum.APPROVED;
}
