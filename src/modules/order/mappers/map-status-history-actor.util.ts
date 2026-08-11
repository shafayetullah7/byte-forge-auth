import type { TOrderStatusHistory } from '@/_db/drizzle/schema/order';

export type StatusHistoryActor = 'BUYER' | 'SELLER' | 'SYSTEM';

export function mapStatusHistoryActor(
  history: TOrderStatusHistory & {
    changedByUser?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  },
  buyerUserId: string | null | undefined,
  shopOwnerUserId: string | null | undefined,
  shopLabel: string | null,
): { actor: StatusHistoryActor; actorLabel: string | null } {
  if (!history.changedBy) {
    return { actor: 'SYSTEM', actorLabel: null };
  }

  if (buyerUserId && history.changedBy === buyerUserId) {
    return { actor: 'BUYER', actorLabel: 'Customer' };
  }

  if (shopOwnerUserId && history.changedBy === shopOwnerUserId) {
    return { actor: 'SELLER', actorLabel: shopLabel ?? 'Shop' };
  }

  if (history.changedByUser) {
    const name =
      `${history.changedByUser.firstName} ${history.changedByUser.lastName}`.trim();
    return { actor: 'SELLER', actorLabel: name || 'Shop' };
  }

  return { actor: 'SYSTEM', actorLabel: null };
}
