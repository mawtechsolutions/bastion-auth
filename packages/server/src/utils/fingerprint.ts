import crypto from 'crypto';

import type { FastifyRequest } from 'fastify';

/**
 * Generate a device fingerprint based on request properties
 * This is used to identify the same device across sessions
 */
export function generateDeviceFingerprint(request: FastifyRequest): string {
  const components = [
    request.ip,
    request.headers['user-agent'] || '',
    request.headers['accept-language'] || '',
    request.headers['accept-encoding'] || '',
  ];

  const fingerprint = components.join('|');
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
}

/**
 * Parse User-Agent to get readable device info
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  // Basic parsing - in production you might use a library like ua-parser-js
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  }

  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return { browser, os, device };
}

/**
 * Get client IP from request, handling proxies
 */
export function getClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (for proxied requests)
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
    return ips[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to direct connection IP
  return request.ip;
}

/**
 * Get geolocation info from IP (stub - would use a service like MaxMind in production)
 */
export async function getGeoFromIp(
  _ip: string
): Promise<{ country: string | null; city: string | null }> {
  // In production, you would use a service like MaxMind GeoIP2
  // For now, return null values
  return {
    country: null,
    city: null,
  };
}

