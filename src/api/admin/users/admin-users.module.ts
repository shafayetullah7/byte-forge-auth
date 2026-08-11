import { Module } from '@nestjs/common';
import { AdminAuthGuardModule } from '@/common/guards/admin-auth-guard/admin-auth-guard.module';
import { OrderModule } from '@/modules/order/order.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AdminAuthGuardModule, OrderModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
