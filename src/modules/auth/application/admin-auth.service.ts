import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { DeviceInfo, TAdmin, TSession } from '@/_db/drizzle/schema';
import { AdminService } from '@/api/admin/admin/admin.service';
import { AppConfigService } from '@/libs/modules/app-config/app-config.service';
import { HashingService } from '@/libs/modules/hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { CreateLocalAdminDto } from '../controllers/dto/create.local.admin.dto';
import { AdminLocalAuthService } from './admin-local-auth.service';
import { AdminSessionService } from './admin-session.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly adminService: AdminService,
    private readonly adminLocalAuthService: AdminLocalAuthService,
    private readonly adminSessionService: AdminSessionService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
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

  async login(
    email: string,
    passwordPlain: string,
    deviceInfo: DeviceInfo,
    ip: string,
  ) {
    const [admin] = await this.adminLocalAuthService.getLocalAdmin({ email });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const passMatch = await this.hashingService.compare(
      passwordPlain,
      admin.adminLocalAuth.password,
    );

    if (!passMatch) {
      throw new BadRequestException('Invalid password');
    }

    const session = await this.adminSessionService.createAdminAuthSession({
      adminAuth: admin,
      deviceInfo,
      ip,
    });

    const accessToken = await this.generateAccessToken(admin.admin, session);
    const refreshToken = await this.generateRefreshToken(admin.admin, session);

    return {
      tokens: { accessToken, refreshToken },
      admin: admin.admin,
      session,
    };
  }

  async generateAccessToken(admin: TAdmin, session: TSession) {
    const payload = {
      sub: admin.id,
      sessionId: session.id,
      role: 'admin',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.jwtAdminAccessSecret,
      expiresIn: this.configService.jwtAdminAccessExp as unknown as number,
    });
  }

  async generateRefreshToken(admin: TAdmin, session: TSession) {
    const payload = {
      sub: admin.id,
      sessionId: session.id,
      role: 'admin',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.jwtAdminRefreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.configService.jwtAdminRefreshExp as any,
    });
  }

  async refreshTokens(currentRefreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        sessionId: string;
        role: string;
      }>(currentRefreshToken, {
        secret: this.configService.jwtAdminRefreshSecret,
      });

      const adminSession = await this.adminSessionService.getAdminSession(
        payload.sessionId,
      );

      if (!adminSession) {
        throw new UnauthorizedException('Invalid session');
      }

      const isRevoked =
        adminSession.session.revoked || adminSession.session.logoutAt;
      const isExpired = new Date() > new Date(adminSession.session.expiresAt);

      if (isRevoked || isExpired) {
        throw new UnauthorizedException('Session revoked or expired');
      }

      const accessToken = await this.generateAccessToken(
        adminSession.admin,
        adminSession.session,
      );

      return {
        tokens: { accessToken, refreshToken: currentRefreshToken },
        admin: adminSession.admin,
        session: adminSession.session,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
