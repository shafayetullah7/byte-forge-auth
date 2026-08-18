import { jwtVerify } from 'jose';
import { OidcJwksClientService, OIDC_JWT_ALGORITHMS } from '../../oidc-jwks-client.service';

jest.mock('jose', () => {
  const actual = jest.requireActual('jose');
  return {
    ...actual,
    jwtVerify: jest.fn(),
    createRemoteJWKSet: jest.fn(() => jest.fn()),
  };
});

describe('OidcJwksClientService', () => {
  const jwtVerifyMock = jwtVerify as jest.MockedFunction<typeof jwtVerify>;

  const service = new OidcJwksClientService({
    oidcInternalIssuer: 'http://localhost:3010',
    oidcIssuer: 'http://localhost:3010',
    oidcDefaultResource: 'http://localhost:3005',
    oidcClientId: 'byte-forge-web',
  } as never);

  beforeEach(() => {
    jwtVerifyMock.mockReset();
    jwtVerifyMock.mockResolvedValue({
      payload: { sub: 'user-1' },
      protectedHeader: { alg: 'RS256' },
    } as never);
  });

  it('verifies access tokens with RS256 only', async () => {
    await service.verifyAccessToken('token');

    expect(jwtVerifyMock).toHaveBeenCalledWith(
      'token',
      expect.anything(),
      expect.objectContaining({
        algorithms: [...OIDC_JWT_ALGORITHMS],
        audience: 'http://localhost:3005',
      }),
    );
  });
});
