import type { TMedia } from '@/_db/drizzle/schema';
import type { TShopVerification } from '@/_db/drizzle/schema/shop/shop.verification.schema';
import type {
  VerificationMedia,
  VerificationStatusResponse,
} from './verification.mapper.types';

export type {
  VerificationMedia,
  VerificationStatusResponse,
} from './verification.mapper.types';

function toVerificationMedia(
  media: TMedia | undefined,
): VerificationMedia | null {
  if (!media) return null;
  return {
    id: media.id,
    url: media.url,
    fileName: media.fileName,
    mimeType: media.mimeType,
    size: media.size,
  };
}

export function mapToVerificationStatusResponse(
  verification: TShopVerification,
  mediaById: Map<string, TMedia>,
): VerificationStatusResponse {
  return {
    id: verification.id,
    shopId: verification.shopId,
    status: verification.status,
    tradeLicenseNumber: verification.tradeLicenseNumber,
    tinNumber: verification.tinNumber,
    tradeLicenseDocumentId: verification.tradeLicenseDocumentId,
    tinDocumentId: verification.tinDocumentId,
    utilityBillDocumentId: verification.utilityBillDocumentId,
    tradeLicenseDocument: verification.tradeLicenseDocumentId
      ? toVerificationMedia(mediaById.get(verification.tradeLicenseDocumentId))
      : null,
    tinDocument: verification.tinDocumentId
      ? toVerificationMedia(mediaById.get(verification.tinDocumentId))
      : null,
    utilityBillDocument: verification.utilityBillDocumentId
      ? toVerificationMedia(mediaById.get(verification.utilityBillDocumentId))
      : null,
    rejectionReason: verification.rejectionReason,
    verifiedAt: verification.verifiedAt,
    createdAt: verification.createdAt,
    updatedAt: verification.updatedAt,
  };
}
