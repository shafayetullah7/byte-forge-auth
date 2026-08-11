import { ShopDomainError } from './shop.errors';
import { ShopStatus } from './shop-status';
import { ShopVerificationStatus } from './shop-verification-status';

/**
 * Status transition graph for shop lifecycle. Must stay in sync with legacy
 * seller/admin flows until HTTP cutover (Phases 21–23).
 */
export const SHOP_STATUS_TRANSITIONS: Record<
  ShopStatus,
  readonly ShopStatus[]
> = {
  [ShopStatus.DRAFT]: [ShopStatus.PENDING_VERIFICATION, ShopStatus.DELETED],
  [ShopStatus.PENDING_VERIFICATION]: [
    ShopStatus.ACTIVE,
    ShopStatus.REJECTED,
    ShopStatus.INACTIVE,
  ],
  [ShopStatus.APPROVED]: [ShopStatus.ACTIVE, ShopStatus.INACTIVE],
  [ShopStatus.ACTIVE]: [
    ShopStatus.PENDING_VERIFICATION,
    ShopStatus.SUSPENDED,
    ShopStatus.INACTIVE,
  ],
  [ShopStatus.INACTIVE]: [ShopStatus.ACTIVE, ShopStatus.PENDING_VERIFICATION],
  [ShopStatus.REJECTED]: [ShopStatus.PENDING_VERIFICATION, ShopStatus.INACTIVE],
  [ShopStatus.SUSPENDED]: [ShopStatus.ACTIVE],
  [ShopStatus.DELETED]: [],
};

export function getAllowedShopTransitions(
  from: ShopStatus,
): readonly ShopStatus[] {
  return SHOP_STATUS_TRANSITIONS[from] ?? [];
}

export function assertShopTransition(from: ShopStatus, to: ShopStatus): void {
  const allowed = getAllowedShopTransitions(from);
  if (!allowed.includes(to)) {
    throw new ShopDomainError(`Cannot transition shop from ${from} to ${to}`);
  }
}

/** Public directory and shop detail pages only expose ACTIVE shops. */
export function isShopPubliclyVisible(status: ShopStatus): boolean {
  return status === ShopStatus.ACTIVE;
}

/** Seller catalog, campaigns, and order fulfillment require an active shop. */
export function canSellerOperateShop(status: ShopStatus): boolean {
  return status === ShopStatus.ACTIVE;
}

export function assertCanSuspendShop(status: ShopStatus): void {
  if (status !== ShopStatus.ACTIVE) {
    throw new ShopDomainError('Only active shops can be suspended');
  }
}

export function assertCanDeactivateShop(status: ShopStatus): void {
  if (status === ShopStatus.INACTIVE) {
    throw new ShopDomainError('Shop is already deactivated');
  }
  if (status === ShopStatus.DELETED) {
    throw new ShopDomainError('Deleted shops cannot be deactivated');
  }
}

export function assertCanReactivateShop(status: ShopStatus): void {
  if (status !== ShopStatus.SUSPENDED && status !== ShopStatus.INACTIVE) {
    throw new ShopDomainError(
      'Only suspended or deactivated shops can be reactivated',
    );
  }
}

const VERIFICATION_RESUBMIT_BLOCKED: readonly ShopVerificationStatus[] = [
  ShopVerificationStatus.PENDING,
  ShopVerificationStatus.REVIEWING,
  ShopVerificationStatus.APPROVED,
];

/** Mirrors seller verification document update guards in legacy `shop.service.ts`. */
export function assertCanResubmitVerificationDocuments(
  verificationStatus: ShopVerificationStatus,
): void {
  if (verificationStatus === ShopVerificationStatus.PENDING) {
    throw new ShopDomainError('Verification is already pending review');
  }
  if (verificationStatus === ShopVerificationStatus.REVIEWING) {
    throw new ShopDomainError('Verification is currently under review');
  }
  if (verificationStatus === ShopVerificationStatus.APPROVED) {
    throw new ShopDomainError('Shop is already verified');
  }
}

export function isVerificationResubmitBlocked(
  verificationStatus: ShopVerificationStatus,
): boolean {
  return VERIFICATION_RESUBMIT_BLOCKED.includes(verificationStatus);
}
