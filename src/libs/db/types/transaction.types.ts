import type { DrizzleTx } from '@/_db/drizzle/types';

export type { DrizzleClient, DrizzleTx } from '@/_db/drizzle/types';

/**
 * Optional transaction + row-lock options for repository methods.
 * When omitted, the repository uses the default connection (auto-commit per statement).
 */
export type TLockTransaction = {
  tx?: DrizzleTx;
  lock?: boolean;
};
