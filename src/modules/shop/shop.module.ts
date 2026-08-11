import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/_db/drizzle/drizzle.module';
import { ShopRepository } from './repositories/shop.repository';

/**
 * Shop domain module. Seller/admin/public HTTP migrates in Phases 21–28.
 * Legacy api shop paths still serve traffic; they import ShopRepository from here.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [ShopRepository],
  exports: [ShopRepository],
})
export class ShopModule {}
