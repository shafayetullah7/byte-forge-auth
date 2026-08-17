import { AppConfigService } from '@/libs/modules/app-config/app-config.service';

describe('AppConfigService OIDC', () => {
  it('oidcInternalIssuer falls back to oidcIssuer when unset', () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'OIDC_ISSUER') return 'http://localhost:3010';
        throw new Error(`unexpected key ${key}`);
      }),
      get: jest.fn((key: string) => {
        if (key === 'OIDC_INTERNAL_ISSUER') return undefined;
        return undefined;
      }),
    };

    const service = new AppConfigService(configService as never);
    expect(service.oidcIssuer).toBe('http://localhost:3010');
    expect(service.oidcInternalIssuer).toBe('http://localhost:3010');
  });

  it('oidcInternalIssuer uses OIDC_INTERNAL_ISSUER when set', () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'OIDC_ISSUER') return 'https://auth.aponika.com';
        throw new Error(`unexpected key ${key}`);
      }),
      get: jest.fn((key: string) => {
        if (key === 'OIDC_INTERNAL_ISSUER') {
          return 'http://aponika-auth-backend:3010';
        }
        return undefined;
      }),
    };

    const service = new AppConfigService(configService as never);
    expect(service.oidcIssuer).toBe('https://auth.aponika.com');
    expect(service.oidcInternalIssuer).toBe('http://aponika-auth-backend:3010');
  });
});
