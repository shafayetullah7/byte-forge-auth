import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { adminTable, TAdmin } from '@/_db/drizzle/schema';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';
import { AdminLocalAuthRepository } from '../repositories/admin-local-auth.repository';

@Injectable()
export class AdminOidcResolverService {
  constructor(
    private readonly adminLocalAuthRepository: AdminLocalAuthRepository,
    private readonly drizzle: DrizzleService,
  ) {}

  async resolveFromToken(token: OidcAccessTokenContext): Promise<TAdmin> {
    const email = token.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Access token missing email claim');
    }

    const localAuth = await this.adminLocalAuthRepository.findOne({ email });
    if (!localAuth) {
      throw new UnauthorizedException('No admin account linked to this identity');
    }

    const [admin] = await this.drizzle.client
      .select()
      .from(adminTable)
      .where(eq(adminTable.id, localAuth.adminId))
      .limit(1);

    if (!admin) {
      throw new UnauthorizedException('Admin account not found');
    }

    return admin;
  }
}
