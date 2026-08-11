export type VerificationMedia = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
};

/** Seller-facing verification status (excludes admin notes). */
export type VerificationStatusResponse = {
  id: string;
  shopId: string;
  status: string;
  tradeLicenseNumber: string | null;
  tinNumber: string | null;
  tradeLicenseDocumentId: string | null;
  tinDocumentId: string | null;
  utilityBillDocumentId: string | null;
  tradeLicenseDocument: VerificationMedia | null;
  tinDocument: VerificationMedia | null;
  utilityBillDocument: VerificationMedia | null;
  rejectionReason: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
