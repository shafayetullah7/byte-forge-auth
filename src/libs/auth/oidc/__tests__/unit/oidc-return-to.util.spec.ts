import { buildFrontendRedirect, safeReturnTo } from '../../oidc-return-to.util';

describe('oidc-return-to.util', () => {
  it('safeReturnTo blocks auth pages', () => {
    expect(safeReturnTo('/login')).toBe('/');
    expect(safeReturnTo('/app/profile')).toBe('/app/profile');
  });

  it('buildFrontendRedirect joins frontend origin and path', () => {
    expect(buildFrontendRedirect('http://localhost:3000', '/app')).toBe(
      'http://localhost:3000/app',
    );
  });
});
