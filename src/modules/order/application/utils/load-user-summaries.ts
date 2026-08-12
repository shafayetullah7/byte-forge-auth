import type {
  UserSummary,
  UserQueryService,
} from '@/modules/user/application/queries';

export type UserSummaryMap = Map<string, UserSummary>;

export async function loadUserSummaries(
  userQuery: UserQueryService,
  userIds: string[],
): Promise<UserSummaryMap> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const summaries = await userQuery.getUserSummaries(uniqueIds);
  return new Map(summaries.map((summary) => [summary.id, summary]));
}

export function collectUserIdsFromOrders(
  orders: Array<{ userId: string }>,
): string[] {
  return orders.map((order) => order.userId).filter(Boolean);
}
