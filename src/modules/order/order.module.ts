import { Module } from '@nestjs/common';

/**
 * Order domain module. Controllers and application services are added in Phases 5–10.
 * Legacy order HTTP + persistence remain under `src/api/**` and `_repositories/` until cutover.
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class OrderModule {}
