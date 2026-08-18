import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { OidcIdentityProvisionerService } from '../../oidc-identity-provisioner.service';
import { UserIdentityRepository } from '../../../repositories/user-identity.repository';
import { CreateUserCommand } from '@/modules/user/application/commands/create-user.command';
import { UserQueryService } from '@/modules/user/application/queries/user.query';
import { DrizzleService } from '@/_db/drizzle/drizzle.service';

describe('OidcIdentityProvisionerService', () => {
  let service: OidcIdentityProvisionerService;
  let userIdentityRepository: jest.Mocked<UserIdentityRepository>;
  let createUserCommand: jest.Mocked<CreateUserCommand>;
  let userQueryService: jest.Mocked<UserQueryService>;
  let drizzle: { client: { transaction: jest.Mock; update: jest.Mock } };
  const mockTx = {
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  };

  const token = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'buyer@example.com',
    email_verified: true,
    aud: 'http://localhost:3005',
    iss: 'http://localhost:3010',
    claims: {},
  };

  const existingUser = {
    id: '11111111-1111-1111-1111-111111111111',
    userName: 'buyer',
    firstName: 'Buyer',
    lastName: 'Example',
    email: 'buyer@example.com',
    avatar: null,
    emailVerifiedAt: new Date(),
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userIdentityRepository = {
      findByAuthSub: jest.fn(),
      findByLocalUserId: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UserIdentityRepository>;

    createUserCommand = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CreateUserCommand>;

    userQueryService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUserName: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<UserQueryService>;

    drizzle = {
      client: {
        transaction: jest.fn(async (fn) => fn(mockTx)),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([existingUser]),
            }),
          }),
        }),
      },
    };

    service = new OidcIdentityProvisionerService(
      drizzle as unknown as DrizzleService,
      userIdentityRepository,
      createUserCommand,
      userQueryService,
    );
  });

  it('returns the same local user for repeated sub (idempotent)', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(existingUser);

    const first = await service.provisionFromToken(token);
    const second = await service.provisionFromToken(token);

    expect(first.id).toBe(existingUser.id);
    expect(second.id).toBe(existingUser.id);
    expect(createUserCommand.execute).not.toHaveBeenCalled();
  });

  it('links existing user by email instead of creating a new user', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue(null);
    userQueryService.findByEmail.mockResolvedValue(existingUser);
    userIdentityRepository.findByLocalUserId.mockResolvedValue(null);
    userQueryService.findById.mockResolvedValue(existingUser);
    userIdentityRepository.create.mockResolvedValue({
      id: 'new-link',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });

    const result = await service.provisionFromToken(token);

    expect(result.id).toBe(existingUser.id);
    expect(userIdentityRepository.create).toHaveBeenCalledWith(
      { authSub: token.sub, localUserId: existingUser.id },
      expect.anything(),
    );
    expect(createUserCommand.execute).not.toHaveBeenCalled();
  });

  it('JIT creates a user when no email match exists', async () => {
    const newUser = {
      ...existingUser,
      id: '22222222-2222-2222-2222-222222222222',
      userName: 'buyer_new',
    };

    userIdentityRepository.findByAuthSub.mockResolvedValue(null);
    userQueryService.findByEmail.mockResolvedValue(null);
    createUserCommand.execute.mockResolvedValue(newUser);
    userQueryService.findById.mockResolvedValue(newUser);
    userIdentityRepository.create.mockResolvedValue({
      id: 'new-link',
      authSub: token.sub,
      localUserId: newUser.id,
      createdAt: new Date(),
    });

    const result = await service.provisionFromToken(token);

    expect(createUserCommand.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'buyer@example.com' }),
      expect.anything(),
    );
    expect(userIdentityRepository.create).toHaveBeenCalledWith(
      { authSub: token.sub, localUserId: newUser.id },
      expect.anything(),
    );
    expect(result.id).toBe(newUser.id);
  });

  it('updates local email when IdP email is verified and different', async () => {
    const staleUser = { ...existingUser, email: 'old@example.com' };
    const updatedUser = { ...existingUser, email: 'buyer@example.com' };

    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(staleUser);
    userQueryService.findByEmail.mockResolvedValue(null);
    drizzle.client.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([updatedUser]),
        }),
      }),
    });

    const result = await service.provisionFromToken(token);

    expect(result.email).toBe('buyer@example.com');
    expect(drizzle.client.update).toHaveBeenCalled();
  });

  it('does not overwrite email from an unverified token', async () => {
    const staleUser = { ...existingUser, email: 'old@example.com' };

    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(staleUser);

    const result = await service.provisionFromToken({
      ...token,
      email: 'new@example.com',
      email_verified: false,
    });

    expect(result.email).toBe('old@example.com');
    expect(drizzle.client.update).not.toHaveBeenCalled();
  });

  it('fails provision when verified email belongs to another user', async () => {
    const staleUser = { ...existingUser, email: 'old@example.com' };

    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(staleUser);
    userQueryService.findByEmail.mockResolvedValue({
      ...existingUser,
      id: '33333333-3333-3333-3333-333333333333',
      email: 'buyer@example.com',
    });

    await expect(service.provisionFromToken(token)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects first-time provision when email is not verified', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue(null);

    await expect(
      service.provisionFromToken({ ...token, email_verified: false }),
    ).rejects.toThrow(UnauthorizedException);

    expect(userQueryService.findByEmail).not.toHaveBeenCalled();
    expect(createUserCommand.execute).not.toHaveBeenCalled();
    expect(userIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException when existing user is linked to another sub', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue(null);
    userQueryService.findByEmail.mockResolvedValue(existingUser);
    userIdentityRepository.findByLocalUserId.mockResolvedValue({
      id: 'other-link',
      authSub: '99999999-9999-9999-9999-999999999999',
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(existingUser);

    await expect(service.provisionFromToken(token)).rejects.toThrow(
      ConflictException,
    );

    expect(userIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('rejects linking when existing user is inactive', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue(null);
    userQueryService.findByEmail.mockResolvedValue({
      ...existingUser,
      isActive: false,
    });

    await expect(service.provisionFromToken(token)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects provision when already-linked user is inactive', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-1',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue({
      ...existingUser,
      isActive: false,
    });

    await expect(service.provisionFromToken(token)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('recovers from unique violation on create by re-fetching auth_sub link', async () => {
    const newUser = {
      ...existingUser,
      id: '22222222-2222-2222-2222-222222222222',
    };

    userIdentityRepository.findByAuthSub
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'race-link',
        authSub: token.sub,
        localUserId: newUser.id,
        createdAt: new Date(),
      });
    userQueryService.findByEmail.mockResolvedValue(null);
    createUserCommand.execute.mockResolvedValue(newUser);
    userQueryService.findById.mockResolvedValue(newUser);
    userIdentityRepository.create.mockRejectedValue({ code: '23505' });

    const result = await service.provisionFromToken(token);

    expect(result.id).toBe(newUser.id);
    expect(userIdentityRepository.findByAuthSub).toHaveBeenCalledTimes(3);
  });

  it('recovers from Drizzle-wrapped unique violation on create', async () => {
    const newUser = {
      ...existingUser,
      id: '22222222-2222-2222-2222-222222222222',
    };

    userIdentityRepository.findByAuthSub
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'race-link',
        authSub: token.sub,
        localUserId: newUser.id,
        createdAt: new Date(),
      });
    userQueryService.findByEmail.mockResolvedValue(null);
    createUserCommand.execute.mockResolvedValue(newUser);
    userQueryService.findById.mockResolvedValue(newUser);
    userIdentityRepository.create.mockRejectedValue({
      message: 'Failed query',
      cause: { code: '23505' },
    });

    const result = await service.provisionFromToken(token);

    expect(result.id).toBe(newUser.id);
    expect(userIdentityRepository.findByAuthSub).toHaveBeenCalledTimes(3);
  });

  it('recovers from local_user_id unique violation when authSub matches', async () => {
    userIdentityRepository.findByAuthSub
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    userQueryService.findByEmail.mockResolvedValue(existingUser);
    userIdentityRepository.findByLocalUserId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'race-link',
        authSub: token.sub,
        localUserId: existingUser.id,
        createdAt: new Date(),
      });
    userQueryService.findById.mockResolvedValue(existingUser);
    userIdentityRepository.create.mockRejectedValue({ code: '23505' });

    const result = await service.provisionFromToken(token);

    expect(result.id).toBe(existingUser.id);
    expect(userIdentityRepository.create).toHaveBeenCalled();
  });
});

describe('OidcIdentityProvisionerService.resolveFromToken', () => {
  let service: OidcIdentityProvisionerService;
  let userIdentityRepository: jest.Mocked<UserIdentityRepository>;
  let userQueryService: jest.Mocked<UserQueryService>;

  const token = {
    sub: '550e8400-e29b-41d4-a716-446655440000',
    email: 'buyer@example.com',
    email_verified: true,
    aud: 'http://localhost:3005',
    iss: 'http://localhost:3010',
    claims: {},
  };

  const existingUser = {
    id: '11111111-1111-1111-1111-111111111111',
    userName: 'buyer',
    firstName: 'Buyer',
    lastName: 'Example',
    email: 'buyer@example.com',
    avatar: null,
    emailVerifiedAt: new Date(),
    emailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userIdentityRepository = {
      findByAuthSub: jest.fn(),
      findByLocalUserId: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UserIdentityRepository>;

    userQueryService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUserName: jest.fn(),
    } as unknown as jest.Mocked<UserQueryService>;

    service = new OidcIdentityProvisionerService(
      { client: { transaction: jest.fn(), update: jest.fn() } } as never,
      userIdentityRepository,
      { execute: jest.fn() } as never,
      userQueryService,
    );
  });

  it('returns linked user without creating identity', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(existingUser);

    const result = await service.resolveFromToken(token);

    expect(result.id).toBe(existingUser.id);
    expect(userIdentityRepository.create).not.toHaveBeenCalled();
  });

  it('throws 401 when identity is not linked', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue(null);

    await expect(service.resolveFromToken(token)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(userQueryService.findById).not.toHaveBeenCalled();
  });

  it('throws 403 when linked user is inactive', async () => {
    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue({
      ...existingUser,
      isActive: false,
    });

    await expect(service.resolveFromToken(token)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('does not backfill missing email on resolve', async () => {
    const userWithoutEmail = { ...existingUser, email: null };
    const drizzleUpdate = jest.fn();

    userIdentityRepository.findByAuthSub.mockResolvedValue({
      id: 'link-id',
      authSub: token.sub,
      localUserId: existingUser.id,
      createdAt: new Date(),
    });
    userQueryService.findById.mockResolvedValue(userWithoutEmail);

    service = new OidcIdentityProvisionerService(
      { client: { transaction: jest.fn(), update: drizzleUpdate } } as never,
      userIdentityRepository,
      { execute: jest.fn() } as never,
      userQueryService,
    );

    const result = await service.resolveFromToken(token);

    expect(result.email).toBe('buyer@example.com');
    expect(drizzleUpdate).not.toHaveBeenCalled();
  });
});
