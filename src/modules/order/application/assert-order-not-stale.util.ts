import { ConflictException } from '@nestjs/common';

export function assertOrderNotStale(
  updatedAt: Date,
  expectedUpdatedAt?: string,
): void {
  if (!expectedUpdatedAt) {
    return;
  }

  const expected = new Date(expectedUpdatedAt).getTime();
  const actual = updatedAt.getTime();

  if (Number.isNaN(expected) || expected !== actual) {
    throw new ConflictException(
      'Order was modified elsewhere. Refresh and try again.',
    );
  }
}
