/**
 * Browser origins allowed for CORS and CSRF Origin/Referer checks.
 * Update this list when adding a new frontend deployment URL.
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3050',
  'https://agro.aponika.com',
] as const;

export function getAllowedOrigins(): string[] {
  return [...ALLOWED_ORIGINS];
}
