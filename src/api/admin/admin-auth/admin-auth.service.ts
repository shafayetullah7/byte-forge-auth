import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { CreateLocalAdminDto } from './dto/create.local.admin.dto';
import { Admin } from 'src/drizzle/schema';
import { AdminService } from '../admin/admin.service';
import { AdminLocalAuthService } from './admin-local-auth.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly adminService: AdminService,
    private readonly adminLocalAuthService: AdminLocalAuthService,
  ) {}

  async register(payload: CreateLocalAdminDto) {
    const { email, firstName, lastName, password, userName } = payload;

    const result = await this.drizzle.client.transaction(async (tx) => {
      const admin = await this.adminService.createAdmin(
        { firstName, lastName, userName },
        tx,
      );

      const adminLocalAuth =
        await this.adminLocalAuthService.createAdminLocalAuth(
          {
            adminId: admin.id,
            email,
            password,
          },
          tx,
        );

      return admin;
    });
  }
}
