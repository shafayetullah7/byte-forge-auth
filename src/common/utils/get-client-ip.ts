// src/utils/get-client-ip.ts
import type { Request } from 'express';

/**
 * Returns the client's IP address from an Express Request.
 * Handles reverse proxies (x-forwarded-for) and falls back to socket address.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ipFromHeader = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : xForwardedFor?.split(',')[0];

  const ip =
    ipFromHeader?.trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    'unknown';

  // IPv6 localhost normalization (e.g., "::1" → "127.0.0.1")
  if (ip === '::1') return '127.0.0.1';

  return ip;
}
