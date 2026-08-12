import { HttpStatus, Injectable } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { CustomException } from '@/libs/exceptions/custom.exception';
import { ErrorCode } from '@/libs/modules/response/dto/error.schema';

@Injectable()
export class CloudinaryService {
  constructor(private readonly cloudinaryProvider: CloudinaryProvider) {}

  /**
   * Upload a single file buffer or stream
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    try {
      return await this.uploadToCloudinary(file.buffer, folder);
    } catch (error: unknown) {
      console.error('Cloudinary Upload Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw CustomException.create({
        message: 'Failed to upload file to media server',
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        details: errorMessage,
      });
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadApiResponse[]> {
    const uploads = files.map((file) =>
      this.uploadToCloudinary(file.buffer, folder),
    );
    return Promise.all(uploads);
  }

  /**
   * Delete a file by public_id
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await this.cloudinaryProvider.client.uploader.destroy(publicId);
    } catch (error: unknown) {
      console.error('Cloudinary Delete Error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw CustomException.create({
        message: `Failed to delete media with publicId ${publicId}`,
        errorCode: ErrorCode.SERVICE_UNAVAILABLE,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        details: errorMessage,
      });
    }
  }

  /**
   * Internal helper to upload buffer to Cloudinary
   */
  private uploadToCloudinary(
    buffer: Buffer,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const cloudinaryClient = this.cloudinaryProvider.client;
      const uploadStream = cloudinaryClient.uploader.upload_stream(
        { folder },
        (error: unknown, result) => {
          if (error) {
            // wrap unknown error safely
            return reject(
              new Error(
                error instanceof Error
                  ? error.message
                  : 'Unknown Cloudinary error',
              ),
            );
          }
          resolve(result as UploadApiResponse);
        },
      );
      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }
}
