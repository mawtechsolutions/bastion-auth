import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRefreshToken } from '../../src/utils/tokens';

// Mock the JWT library for testing without actual keys
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mocked-jwt-token'),
    verify: vi.fn().mockImplementation((token: string) => {
      if (token === 'valid-token') {
        return {
          sub: 'user-123',
          type: 'access',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
      }
      throw new Error('Invalid token');
    }),
  },
}));

describe('Token Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(32);
    });

    it('should generate unique tokens each time', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateRefreshToken();
      
      // Token should only contain URL-safe characters
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });
});

