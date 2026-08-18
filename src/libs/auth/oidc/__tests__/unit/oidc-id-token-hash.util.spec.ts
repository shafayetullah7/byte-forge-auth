import { computeOidcAtHash, assertOidcAtHash } from '../../oidc-id-token-hash.util';

describe('oidc-id-token-hash.util', () => {
  const accessToken = 'access-token-value';

  it('computes a stable RS256 at_hash', () => {
    const hash = computeOidcAtHash(accessToken, 'RS256');
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(computeOidcAtHash(accessToken, 'RS256')).toBe(hash);
  });

  it('accepts a matching at_hash and rejects a mismatch', () => {
    const hash = computeOidcAtHash(accessToken, 'RS256');
    expect(() => assertOidcAtHash(accessToken, hash, 'RS256')).not.toThrow();
    expect(() => assertOidcAtHash(accessToken, 'nope', 'RS256')).toThrow(
      /at_hash/,
    );
  });
});
