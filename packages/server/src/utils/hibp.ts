import crypto from 'crypto';

import { env } from '../config/env.js';

/**
 * Check if a password has been found in a data breach using HaveIBeenPwned API
 * Uses k-anonymity to never send the full password hash
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  // Generate SHA-1 hash of password
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.substring(0, 5);
  const suffix = sha1.substring(5);

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'BastionAuth',
      'Add-Padding': 'true', // Prevent response size analysis
    };

    // Add API key if available (for higher rate limits)
    if (env.HIBP_API_KEY) {
      headers['hibp-api-key'] = env.HIBP_API_KEY;
    }

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers,
    });

    if (!response.ok) {
      // Fail open - don't block sign-up if HIBP is unavailable
      console.warn('HIBP API request failed:', response.status);
      return false;
    }

    const text = await response.text();
    const lines = text.split('\r\n');

    for (const line of lines) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password found in breaches
      }
    }

    return false;
  } catch (error) {
    // Fail open - don't block sign-up if HIBP is unavailable
    console.warn('HIBP API error:', error);
    return false;
  }
}

