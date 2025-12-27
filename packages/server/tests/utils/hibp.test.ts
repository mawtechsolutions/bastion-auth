import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { isPasswordBreached } from '../../src/utils/hibp';

describe('HaveIBeenPwned Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('isPasswordBreached', () => {
    it('should return true for a breached password', async () => {
      // SHA-1 of 'password123' is CBFDAC6008F9CAB4083784CBD1874F76618D2A97
      // Prefix: CBFDA, Suffix: C6008F9CAB4083784CBD1874F76618D2A97
      const suffix = 'C6008F9CAB4083784CBD1874F76618D2A97';
      const mockResponse = `${suffix}:12345\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5`;
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      } as Response);
      
      const result = await isPasswordBreached('password123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for a non-breached password', async () => {
      // Return a response that doesn't contain the hash suffix for our test password
      const mockResponse = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:10';
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      } as Response);
      
      const result = await isPasswordBreached('MyVeryUniquePassword!2024');
      
      expect(result).toBe(false);
    });

    it('should return false when API fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await isPasswordBreached('password123');
      
      // Should fail open - not blocking user registration
      expect(result).toBe(false);
    });

    it('should return false when API returns non-OK status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      
      const result = await isPasswordBreached('password123');
      
      expect(result).toBe(false);
    });

    it('should use k-anonymity by only sending hash prefix', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      } as Response);
      
      await isPasswordBreached('test123');
      
      // Verify only the first 5 characters of SHA-1 hash are sent
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/api\.pwnedpasswords\.com\/range\/[A-F0-9]{5}$/),
        expect.any(Object)
      );
    });
  });
});

