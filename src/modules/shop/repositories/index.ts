export { ShopRepository } from './shop.repository';
export { ShopVerificationRepository } from './shop-verification.repository';
export { ShopVerificationHistoryRepository } from './shop-verification-history.repository';
export {
  mapShopRowToEntity,
  mapShopEntityToRow,
  mapShopEntityToUpdatePatch,
  mapShopTranslationRow,
  mapShopTranslationRows,
  type ShopTranslationRecord,
} from './shop.repository.mapper';
