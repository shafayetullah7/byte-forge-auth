import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { CloudinaryModule } from '@/libs/modules/cloudinary/cloudinary.module';
import { LoggerModule } from '@/libs/modules/logger/logger.module';
import { AdminMediaService, MediaService } from './application';
import { AdminMediaController, MediaController } from './controllers';
import { MediaRepository } from './repositories';

@Module({
  imports: [DrizzleModule, CloudinaryModule, LoggerModule],
  controllers: [MediaController, AdminMediaController],
  providers: [MediaRepository, MediaService, AdminMediaService],
  exports: [MediaRepository, MediaService],
})
export class MediaModule {}
