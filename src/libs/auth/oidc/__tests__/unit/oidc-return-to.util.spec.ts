import { buildFrontendRedirect, safeReturnTo } from '../../oidc-return-to.util';

describe('oidc-return-to.util', () => {
  it('safeReturnTo blocks auth pages', () => {
    expect(safeReturnTo('/login')).toBe('/');
    expect(safeReturnTo('/app/profile')).toBe('/app/profile');
  });

  it('decodes then rejects encoded slashes and protocol-relative paths', () => {
    expect(safeReturnTo('/login%2Fevil')).toBe('/');
    expect(safeReturnTo('//evil')).toBe('/');
    expect(safeReturnTo('/app\\profile')).toBe('/');
    expect(safeReturnTo('/shops/foo?ref=1')).toBe('/shops/foo?ref=1');
  });

  it('buildFrontendRedirect joins frontend origin and path', () => {
    expect(buildFrontendRedirect('http://localhost:3000', '/app')).toBe(
      'http://localhost:3000/app',
    );
  });
});
