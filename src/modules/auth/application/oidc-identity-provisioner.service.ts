import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';
import { TUser, userTable } from '@/_db/drizzle/schema';
import { DrizzleTx } from '@/_db/drizzle/types';
import { OidcAccessTokenContext } from '@/libs/types/oidc-access-token.type';
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { UserIdentityRepository } from '../repositories/user-identity.repository';
import { UserLocalAuthRepository } from '../repositories/user-local-auth.repository';

export type OidcProvisionedUser = TUser & { email: string };

function isPostgresUniqueViolation(error: unknown): boolean {
  return (error as { code?: string }).code === '23505';
}

@Injectable()
export class OidcIdentityProvisionerService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userIdentityRepository: UserIdentityRepository,
    private readonly userLocalAuthRepository: UserLocalAuthRepository,
    private readonly createUserCommand: CreateUserCommand,
    private readonly userQueryService: UserQueryService,
  ) {}

  async provisionFromToken(
    token: OidcAccessTokenContext,
  ): Promise<OidcProvisionedUser> {
    if (!token.sub) {
      throw new UnauthorizedException('Invalid access token');
    }

    const email = token.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Access token missing email claim');
    }

    const existingLink = await this.userIdentityRepository.findByAuthSub(
      token.sub,
    );
    if (existingLink) {
      return this.resolveLinkedUser(existingLink.localUserId, email);
    }

    return this.drizzle.client.transaction(async (tx) => {
      const linked = await this.userIdentityRepository.findByAuthSub(
        token.sub,
        tx,
      );
      if (linked) {
        return this.resolveLinkedUser(linked.localUserId, email);
      }

      if (!token.email_verified) {
        throw new UnauthorizedException('Email must be verified');
      }

      const legacy = await this.userLocalAuthRepository.findOne({ email }, tx);
      if (legacy) {
        return this.linkLegacyUser(token, legacy.userId, email, tx);
      }

      return this.provisionNewUser(token, email, tx);
    });
  }

  private async resolveLinkedUser(
    localUserId: string,
    email: string,
  ): Promise<OidcProvisionedUser> {
    const user = await this.userQueryService.findById(localUserId);
    if (!user) {
      throw new UnauthorizedException('Linked user not found');
    }
    return { ...user, email };
  }

  private async linkLegacyUser(
    token: OidcAccessTokenContext,
    localUserId: string,
    email: string,
    tx: DrizzleTx,
  ): Promise<OidcProvisionedUser> {
    const user = await this.userQueryService.findById(localUserId);
    if (!user) {
      throw new UnauthorizedException('Linked user not found');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const existingIdentity =
      await this.userIdentityRepository.findByLocalUserId(localUserId, tx);
    if (existingIdentity) {
      if (existingIdentity.authSub === token.sub) {
        return { ...user, email };
      }
      throw new ConflictException(
        'Account already linked to another identity',
      );
    }

    await this.createIdentityWithRaceRecovery(token.sub, localUserId, tx);

    if (!user.emailVerifiedAt) {
      await tx
        .update(userTable)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(userTable.id, user.id));
    }

    const refreshed = await this.userQueryService.findById(localUserId);
    return { ...(refreshed ?? user), email };
  }

  private async provisionNewUser(
    token: OidcAccessTokenContext,
    email: string,
    tx: DrizzleTx,
  ): Promise<OidcProvisionedUser> {
    const userName = await this.allocateUserName(email, tx);
    const [firstName, ...rest] = email.split('@')[0].split(/[._+-]/);
    const lastName = rest.join('_') || 'User';

    const user = await this.createUserCommand.execute(
      {
        userName,
        firstName: this.sanitizeNamePart(firstName) || 'User',
        lastName: this.sanitizeNamePart(lastName) || 'Account',
      },
      tx,
    );

    if (token.email_verified) {
      await tx
        .update(userTable)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(userTable.id, user.id));
    }

    await this.createIdentityWithRaceRecovery(token.sub, user.id, tx);

    const refreshed = await this.userQueryService.findById(user.id);
    return { ...(refreshed ?? user), email };
  }

  private async createIdentityWithRaceRecovery(
    authSub: string,
    localUserId: string,
    tx: DrizzleTx,
  ): Promise<void> {
    try {
      await this.userIdentityRepository.create(
        { authSub, localUserId },
        tx,
      );
    } catch (error) {
      if (!isPostgresUniqueViolation(error)) {
        throw error;
      }

      const linked = await this.userIdentityRepository.findByAuthSub(authSub, tx);
      if (linked) {
        return;
      }

      const existingForUser =
        await this.userIdentityRepository.findByLocalUserId(localUserId, tx);
      if (existingForUser && existingForUser.authSub !== authSub) {
        throw new ConflictException(
          'Account already linked to another identity',
        );
      }

      throw error;
    }
  }

  private sanitizeNamePart(value: string): string {
    const cleaned = value.replace(/[^a-zA-Z]/g, '');
    return cleaned.slice(0, 50);
  }

  private async allocateUserName(
    email: string,
    tx?: DrizzleTx,
  ): Promise<string> {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40);

    const seed = base.length >= 3 ? base : `user_${base}`;
    let candidate = seed;
    let attempt = 0;

    while (attempt < 20) {
      const existing = await this.userQueryService.findByUserName(candidate);
      if (!existing) {
        return candidate;
      }
      attempt += 1;
      candidate = `${seed}_${attempt}`.slice(0, 50);
    }

    return `user_${randomBytes(4).toString('hex')}`.slice(0, 50);
  }
}
