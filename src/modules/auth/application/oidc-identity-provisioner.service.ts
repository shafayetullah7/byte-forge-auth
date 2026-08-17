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

export type OidcProvisionedUser = TUser & { email: string };

function readPostgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }

    const code = (current as { code?: string }).code;
    if (code) {
      return code;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return undefined;
}

function isPostgresUniqueViolation(error: unknown): boolean {
  return readPostgresErrorCode(error) === '23505';
}

@Injectable()
export class OidcIdentityProvisionerService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userIdentityRepository: UserIdentityRepository,
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

      const existingUser = await this.userQueryService.findByEmail(email, {
        tx,
        lock: false,
      });
      if (existingUser) {
        return this.linkExistingUser(token, existingUser, email, tx);
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
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const synced = await this.ensureUserEmail(user, email);
    return { ...synced, email: synced.email ?? email };
  }

  private async linkExistingUser(
    token: OidcAccessTokenContext,
    user: TUser,
    email: string,
    tx: DrizzleTx,
  ): Promise<OidcProvisionedUser> {
    if (!user.isActive) {
      throw new ForbiddenException('Account is inactive');
    }

    const existingIdentity = await this.userIdentityRepository.findByLocalUserId(
      user.id,
      tx,
    );
    if (existingIdentity) {
      if (existingIdentity.authSub === token.sub) {
        const synced = await this.ensureUserEmail(user, email, tx);
        return { ...synced, email: synced.email ?? email };
      }
      throw new ConflictException(
        'Account already linked to another identity',
      );
    }

    await this.createIdentityWithRaceRecovery(token.sub, user.id, tx);

    if (!user.emailVerifiedAt) {
      await tx
        .update(userTable)
        .set({ emailVerifiedAt: new Date() })
        .where(eq(userTable.id, user.id));
    }

    const refreshed = await this.userQueryService.findById(user.id);
    const synced = refreshed
      ? await this.ensureUserEmail(refreshed, email, tx)
      : await this.ensureUserEmail(user, email, tx);
    return { ...synced, email: synced.email ?? email };
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
        email,
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

  private async ensureUserEmail(
    user: TUser,
    email: string,
    tx?: DrizzleTx,
  ): Promise<TUser> {
    if (user.email) {
      return user;
    }

    const executor = tx ?? this.drizzle.client;
    const [updated] = await executor
      .update(userTable)
      .set({ email })
      .where(eq(userTable.id, user.id))
      .returning();

    return updated ?? user;
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
