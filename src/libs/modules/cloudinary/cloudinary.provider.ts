import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../app-config/app-config.service';
import { v2 as cloudinary } from 'cloudinary';
// const { v2 } = cloudinary;

@Injectable()
export class CloudinaryProvider {
  constructor(private readonly configService: AppConfigService) {
    cloudinary.config({
      cloud_name: this.configService.cloudinaryCloudName,
      api_key: this.configService.cloudinaryApiKey,
      api_secret: this.configService.cloudinaryApiSecret,
    });
  }

  get client() {
    return cloudinary;
  }
}
