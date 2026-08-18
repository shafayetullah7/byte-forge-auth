import { createHash } from 'node:crypto';

/**
 * OIDC Core at_hash: left-most half of the hash of `access_token`,
 * using the hash of the JWS alg (RS256 → SHA-256).
 */
export function computeOidcAtHash(accessToken: string, alg: string): string {
  const digest = createHash(hashNameForJwtAlg(alg)).update(accessToken).digest();
  return digest.subarray(0, digest.length / 2).toString('base64url');
}

export function assertOidcAtHash(
  accessToken: string,
  atHash: string,
  alg: string,
): void {
  if (computeOidcAtHash(accessToken, alg) !== atHash) {
    throw new Error('id_token at_hash does not match access_token');
  }
}

function hashNameForJwtAlg(alg: string): string {
  if (alg.endsWith('512')) return 'sha512';
  if (alg.endsWith('384')) return 'sha384';
  return 'sha256';
}
