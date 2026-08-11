import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import {
  shopVerificationTable,
  shopVerificationHistoryTable,
} from '@/_db/drizzle/schema';

@Injectable()
export class GetShopVerificationDetailsQuery {
  constructor(private readonly db: DrizzleService) {}

  async execute(shopId: string) {
    const [verification, history] = await Promise.all([
      this.db.client.query.shopVerificationTable.findFirst({
        where: eq(shopVerificationTable.shopId, shopId),
        with: {
          tradeLicenseMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
          tinMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
          utilityBillMedia: {
            columns: {
              id: true,
              url: true,
              fileName: true,
            },
          },
        },
      }),
      this.db.client.query.shopVerificationHistoryTable.findMany({
        where: eq(shopVerificationHistoryTable.shopId, shopId),
        orderBy: desc(shopVerificationHistoryTable.createdAt),
      }),
    ]);

    if (!verification) {
      throw new NotFoundException('Shop verification record not found');
    }

    return {
      shopId: verification.shopId,
      status: verification.status,
      submittedAt: verification.createdAt,
      verifiedAt: verification.verifiedAt,

      tradeLicenseDocumentId: verification.tradeLicenseDocumentId,
      tinDocumentId: verification.tinDocumentId,
      utilityBillDocumentId: verification.utilityBillDocumentId,

      tradeLicenseNumber: verification.tradeLicenseNumber,
      tradeLicenseDocument: verification.tradeLicenseMedia
        ? {
            id: verification.tradeLicenseMedia.id,
            url: verification.tradeLicenseMedia.url,
            name: verification.tradeLicenseMedia.fileName || 'Trade License',
          }
        : null,
      tinNumber: verification.tinNumber,
      tinDocument: verification.tinMedia
        ? {
            id: verification.tinMedia.id,
            url: verification.tinMedia.url,
            name: verification.tinMedia.fileName || 'TIN Certificate',
          }
        : null,
      utilityBillDocument: verification.utilityBillMedia
        ? {
            id: verification.utilityBillMedia.id,
            url: verification.utilityBillMedia.url,
            name: verification.utilityBillMedia.fileName || 'Utility Bill',
          }
        : null,

      adminNotes: verification.adminNotes,
      rejectionReason: verification.rejectionReason,

      history: history.map((h) => ({
        id: h.id,
        action: h.action,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        reason: h.reason,
        timestamp: h.createdAt,
      })),
    };
  }
}
