import { TMedia, TNewMedia, TUserUploadMedia } from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';

export type TUserMediaQueryOption = {
  userId?: string;
  used?: boolean;
  mediaIds?: string[];
  transactionInfo?: {
    transaction?: DrizzleTx;
    lock?: boolean;
  };
};

export type TUserMediaQueryResult = TMedia & Pick<TUserUploadMedia, 'userId'>;

export interface IMediaRepository {
  createMedia(
    payload: {
      media: TNewMedia;
      cloudinary?: { publicKey: string };
      userId: string;
    },
    tx?: DrizzleTx,
  ): Promise<any>;
  deleteMedia(mediaId: string, tx?: DrizzleTx): Promise<void>;
  findUserMedia(
    options: TUserMediaQueryOption,
  ): Promise<TUserMediaQueryResult[]>;
  findMediaDetailsById(
    mediaId: string,
    transaction: {
      tx: DrizzleTx;
      lock: boolean;
    },
  ): Promise<any>;
  areMediaUsed(records: TMedia[]): boolean;
  useMedia(mediaIds: string[], tx: DrizzleTx): Promise<void>;
  incrementMediaUsage(
    mediaIds: string[],
    tx: DrizzleTx,
    incrementBy?: number,
  ): Promise<void>;
}
