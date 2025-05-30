import { Injectable } from '@nestjs/common';
import { DrizzleService } from 'src/drizzle/drizzle.service';
import { CreateLocalAdminDto } from './dto/create.local.admin.dto';
import { AdminService } from '../admin/admin.service';
import { AdminLocalAuthService } from './admin-local-auth.service';
import { LocalAdminAuth } from './types/local-auth-admin.type';
import { DeviceInfo } from 'src/drizzle/schema';
import { AdminSessionService } from '../admin-session/admin-session.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly adminService: AdminService,
    private readonly adminLocalAuthService: AdminLocalAuthService,
    private readonly adminSessionService: AdminSessionService,
  ) {}

  async register(payload: CreateLocalAdminDto) {
    const { email, firstName, lastName, password, userName } = payload;

    const result = await this.drizzle.client.transaction(async (tx) => {
      const admin = await this.adminService.createAdmin(
        { firstName, lastName, userName },
        tx,
      );

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

    return result;
  }

  async login(payload: {
    adminAuth: LocalAdminAuth;
    deviceInfo: DeviceInfo;
    ip: string;
  }) {
    const { adminAuth, deviceInfo, ip } = payload;

    const session = await this.adminSessionService.createAdminAuthSession({
      adminAuth,
      deviceInfo,
      ip,
    });
    return session;
  }
}
