import type { PlantAiDraftRequest } from './plant-ai-draft.schema';

/** Matches seller wizard ImageUpload allowed types. */
export const PLANT_AI_ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type PlantAiAllowedImageMime = (typeof PLANT_AI_ALLOWED_IMAGE_MIMES)[number];

export function isAllowedPlantAiImageMime(mimeType: string): boolean {
  return PLANT_AI_ALLOWED_IMAGE_MIMES.includes(
    mimeType as PlantAiAllowedImageMime,
  );
}

export function isPhotoOnlyPlantAiRequest(request: PlantAiDraftRequest): boolean {
  return Boolean(
    request.thumbnailMediaId &&
      !request.plantName?.trim() &&
      !request.scientificName?.trim(),
  );
}
