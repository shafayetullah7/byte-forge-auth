import type { ReviewImageWithMedia } from '@/modules/review/repositories/review.repository.types';

export function mapReviewImages(
  images: ReviewImageWithMedia[] | null | undefined,
) {
  return (images ?? []).map((image) => ({
    id: image.id,
    displayOrder: image.displayOrder,
    media: image.media ? { id: image.media.id, url: image.media.url } : null,
  }));
}
