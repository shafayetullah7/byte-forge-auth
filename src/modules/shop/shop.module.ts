import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { MediaRepositoryModule } from '@/_repositories/providers/media/media.repository/media.repository.module';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { SellerShopGuardModule } from '@/common/guards/seller-shop-guard/seller-shop.guard.module';
import {
  ApplyAsSellerCommand,
  ApproveShopCommand,
  DeactivateShopCommand,
  DeleteShopCommand,
  ReactivateShopCommand,
  RejectShopCommand,
  SubmitShopForReviewCommand,
  SuspendShopCommand,
  UpdateMyShopAddressCommand,
  UpdateMyShopBrandingCommand,
  UpdateMyShopCommand,
  UpdateVerificationDocumentsCommand,
  UploadShopImagesCommand,
  UpsertMyShopContactCommand,
  UpsertMyShopInfoCommand,
} from './application/commands';
import { ShopProfileSectionService } from './application/shop-profile-section.service';
import {
  GetAdminShopByIdQuery,
  GetMyShopQuery,
  GetMyShopVerificationQuery,
  GetMyVerificationHistoryQuery,
  GetPendingVerificationsQuery,
  GetShopStatsQuery,
  GetShopStatusQuery,
  GetShopVerificationDetailsQuery,
  ListAdminShopsQuery,
} from './application/queries';
import {
  AdminShopsController,
  SellerShopProfileController,
} from './controllers';
import {
  ShopRepository,
  ShopVerificationHistoryRepository,
  ShopVerificationRepository,
} from './repositories';

@Module({
  imports: [
    DrizzleModule,
    MediaRepositoryModule,
    AdminAuthGuardModule,
    // VerifiedUserAuthGuardModule is @Global in AppModule — do not import here
    // (circular: VerifiedUserAuthGuardModule → ShopModule).
    SellerShopGuardModule,
  ],
  controllers: [SellerShopProfileController, AdminShopsController],
  providers: [
    ShopRepository,
    ShopVerificationRepository,
    ShopVerificationHistoryRepository,
    ShopProfileSectionService,
    GetShopStatusQuery,
    GetMyShopQuery,
    GetMyShopVerificationQuery,
    GetMyVerificationHistoryQuery,
    GetPendingVerificationsQuery,
    ListAdminShopsQuery,
    GetAdminShopByIdQuery,
    GetShopStatsQuery,
    GetShopVerificationDetailsQuery,
    ApplyAsSellerCommand,
    UpdateMyShopCommand,
    UpdateMyShopBrandingCommand,
    UpsertMyShopInfoCommand,
    UpsertMyShopContactCommand,
    UpdateMyShopAddressCommand,
    UpdateVerificationDocumentsCommand,
    SubmitShopForReviewCommand,
    UploadShopImagesCommand,
    DeleteShopCommand,
    ApproveShopCommand,
    RejectShopCommand,
    SuspendShopCommand,
    DeactivateShopCommand,
    ReactivateShopCommand,
  ],
  exports: [
    ShopRepository,
    ShopVerificationRepository,
    ShopVerificationHistoryRepository,
    GetShopStatusQuery,
    GetMyShopQuery,
    ApplyAsSellerCommand,
    UpdateMyShopCommand,
    UpdateMyShopBrandingCommand,
    UpsertMyShopInfoCommand,
    UpsertMyShopContactCommand,
    UpdateMyShopAddressCommand,
  ],
})
export class ShopModule {}
