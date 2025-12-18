import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPasswordBreached } from '../../src/utils/hibp';

describe('HaveIBeenPwned Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPasswordBreached', () => {
    it('should return true for a breached password', async () => {
      const mockResponse = '00D4F6E8FA6EECAD2A3AA415EEC418D38EC:5\r\n1234567890ABCDEF1234567890ABCDEF123:10';
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      } as Response);
      
      const result = await isPasswordBreached('password123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for a non-breached password', async () => {
      const mockResponse = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5\r\nBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB:10';
      
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockResponse),
      } as Response);
      
      const result = await isPasswordBreached('MyVeryUniquePassword!2024');
      
      expect(result).toBe(false);
    });

    it('should return false when API fails', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await isPasswordBreached('password123');
      
      expect(result).toBe(false);
    });

    it('should return false when API returns non-OK status', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      
      const result = await isPasswordBreached('password123');
      
      expect(result).toBe(false);
    });

    it('should use k-anonymity by only sending hash prefix', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      } as Response);
      
      await isPasswordBreached('test123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/api\.pwnedpasswords\.com\/range\/[A-F0-9]{5}$/),
        expect.any(Object)
      );
    });
  });
});

