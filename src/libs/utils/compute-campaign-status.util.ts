export type CampaignRuntimeStatus = 'ACTIVE' | 'UPCOMING' | 'COMPLETED';

export function computeCampaignStatus(
  startDate: Date,
  endDate: Date,
  now: Date = new Date(),
): CampaignRuntimeStatus {
  if (now < startDate) return 'UPCOMING';
  if (now > endDate) return 'COMPLETED';
  return 'ACTIVE';
}
