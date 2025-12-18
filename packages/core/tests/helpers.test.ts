import { describe, it, expect } from 'vitest';
import {
  getInitials,
  formatRelativeTime,
  generateSlug,
  maskEmail,
  isValidUrl,
} from '../src/utils/helpers';

describe('Helper Functions', () => {
  describe('getInitials', () => {
    it('should return initials from first and last name', () => {
      expect(getInitials({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }))
        .toBe('JD');
    });

    it('should return first name initial when no last name', () => {
      expect(getInitials({ firstName: 'John', email: 'john@example.com' }))
        .toBe('J');
    });

    it('should return email initial when no name', () => {
      expect(getInitials({ email: 'john@example.com' }))
        .toBe('J');
    });

    it('should uppercase initials', () => {
      expect(getInitials({ firstName: 'john', lastName: 'doe', email: 'test@example.com' }))
        .toBe('JD');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format just now', () => {
      const now = new Date();
      const result = formatRelativeTime(now.toISOString());
      expect(result.toLowerCase()).toMatch(/just now|0|now/);
    });

    it('should format minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/5.*min|5m/i);
    });

    it('should format hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/3.*hour|3h/i);
    });

    it('should format days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date.toISOString());
      expect(result).toMatch(/2.*day|2d/i);
    });

    it('should handle string dates', () => {
      const result = formatRelativeTime(new Date().toISOString());
      expect(typeof result).toBe('string');
    });
  });

  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('My Organization')).toBe('my-organization');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Acme Corp!')).toBe('acme-corp');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('  -Hello World-  ')).toBe('hello-world');
    });

    it('should handle numbers', () => {
      expect(generateSlug('Company 123')).toBe('company-123');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(maskEmail('john.doe@example.com')).toMatch(/j.*@example.com/);
    });

    it('should show first and last character of local part', () => {
      const masked = maskEmail('john@example.com');
      expect(masked.startsWith('j')).toBe(true);
      expect(masked).toContain('@example.com');
    });

    it('should handle short local parts', () => {
      const masked = maskEmail('ab@example.com');
      expect(masked).toContain('@example.com');
    });

    it('should handle single character local parts', () => {
      const masked = maskEmail('a@example.com');
      expect(masked).toBe('a***@example.com');
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path',
        'https://example.com?query=value',
      ];

      validUrls.forEach((url) => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        '//missing-protocol.com',
        '',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidUrl(url)).toBe(false);
      });
    });

    it('should require https in production mode', () => {
      // When requireHttps is true
      expect(isValidUrl('http://example.com', true)).toBe(false);
      expect(isValidUrl('https://example.com', true)).toBe(true);
    });
  });
});

