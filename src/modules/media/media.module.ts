import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { CloudinaryModule } from '@/common/modules/cloudinary/cloudinary.module';
import { LoggerModule } from '@/common/modules/logger/logger.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { UserAuthGuardModule } from '@/common/guards/user-auth-guard/user-auth-guard.module';
import { AdminMediaService, MediaService } from './application';
import { AdminMediaController, MediaController } from './controllers';
import { MediaRepository } from './repositories';

@Module({
  imports: [
    DrizzleModule,
    CloudinaryModule,
    LoggerModule,
    UserAuthGuardModule,
    AdminAuthGuardModule,
  ],
  controllers: [MediaController, AdminMediaController],
  providers: [MediaRepository, MediaService, AdminMediaService],
  exports: [MediaRepository, MediaService],
})
export class MediaModule {}
