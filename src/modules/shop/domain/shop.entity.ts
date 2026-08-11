import {
  assertCanDeactivateShop,
  assertCanReactivateShop,
  assertCanResubmitVerificationDocuments,
  assertCanSuspendShop,
  assertShopTransition,
  canSellerOperateShop,
  isShopPubliclyVisible,
} from './shop-policy';
import { ShopDomainError } from './shop.errors';
import { ShopStatus, isTerminalShopStatus } from './shop-status';
import { ShopVerificationStatus } from './shop-verification-status';

export interface ShopEntityProps {
  id: string;
  ownerId: string;
  slug: string;
  status: ShopStatus;
  isVerified: boolean;
  logoId: string | null;
  bannerId: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Shop {
  readonly id: string;
  readonly ownerId: string;
  slug: string;
  status: ShopStatus;
  isVerified: boolean;
  logoId: string | null;
  bannerId: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: ShopEntityProps) {
    this.id = props.id;
    this.ownerId = props.ownerId;
    this.slug = props.slug;
    this.status = props.status;
    this.isVerified = props.isVerified;
    this.logoId = props.logoId;
    this.bannerId = props.bannerId;
    this.primaryColor = props.primaryColor;
    this.secondaryColor = props.secondaryColor;
    this.accentColor = props.accentColor;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isTerminal(): boolean {
    return isTerminalShopStatus(this.status);
  }

  isPubliclyVisible(): boolean {
    return isShopPubliclyVisible(this.status);
  }

  canSellerOperate(): boolean {
    return canSellerOperateShop(this.status);
  }

  /** Seller submits shop profile for admin review. */
  submitForReview(): void {
    this.transitionTo(ShopStatus.PENDING_VERIFICATION);
  }

  /** Seller resubmits verification documents after rejection. */
  resubmitVerificationDocuments(
    verificationStatus: ShopVerificationStatus,
  ): void {
    assertCanResubmitVerificationDocuments(verificationStatus);
    this.transitionTo(ShopStatus.PENDING_VERIFICATION);
  }

  /** Admin approves verification — shop goes live. */
  approveVerification(): void {
    this.transitionTo(ShopStatus.ACTIVE);
    this.isVerified = true;
  }

  /** Admin rejects verification. */
  rejectVerification(): void {
    this.transitionTo(ShopStatus.REJECTED);
    this.isVerified = false;
  }

  /** Admin suspends an active shop. */
  suspend(): void {
    assertCanSuspendShop(this.status);
    this.status = ShopStatus.SUSPENDED;
    this.isVerified = false;
    this.touch();
  }

  /** Admin or seller deactivates the shop. */
  deactivate(): void {
    assertCanDeactivateShop(this.status);
    this.status = ShopStatus.INACTIVE;
    this.isVerified = false;
    this.touch();
  }

  /** Admin reactivates a suspended or inactive shop. */
  reactivate(): void {
    assertCanReactivateShop(this.status);
    this.transitionTo(ShopStatus.ACTIVE);
  }

  markDeleted(): void {
    if (this.status === ShopStatus.DELETED) {
      throw new ShopDomainError('Shop is already deleted');
    }
    this.status = ShopStatus.DELETED;
    this.isVerified = false;
    this.touch();
  }

  private transitionTo(nextStatus: ShopStatus): void {
    assertShopTransition(this.status, nextStatus);
    this.status = nextStatus;
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }
}
