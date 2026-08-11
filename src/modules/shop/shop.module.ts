import { Module } from '@nestjs/common';

/**
 * Shop domain module. Seller/admin/public HTTP and repositories migrate here
 * in Phases 20–28. Legacy api and _repositories shop paths remain until cutover.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ShopModule {}
