import { describe, it, expect } from 'vitest';
import { 
  emailSchema, 
  passwordSchema, 
  signUpSchema, 
  signInSchema,
  organizationNameSchema,
} from '../src/utils/validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'first.last@subdomain.example.com',
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
        '',
        'user name@example.com',
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it('should lowercase email addresses', () => {
      const result = emailSchema.parse('TEST@EXAMPLE.COM');
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'SecurePass123!',
        'MyP@ssword99',
        'Complex#Password1',
        'Test$1234567',
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      const result = passwordSchema.safeParse('lowercase123!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      const result = passwordSchema.safeParse('UPPERCASE123!');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      const result = passwordSchema.safeParse('NoNumbers!!');
      expect(result.success).toBe(false);
    });
  });

  describe('signUpSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow optional firstName and lastName', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
      };

      const result = signUpSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should validate correct signin data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should not enforce password strength on signin', () => {
      const validData = {
        email: 'test@example.com',
        password: '123', // Weak password but ok for signin
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('organizationNameSchema', () => {
    it('should validate correct organization names', () => {
      const validNames = [
        'Acme Corp',
        'My Organization',
        'Company 123',
        'A',
      ];

      validNames.forEach((name) => {
        const result = organizationNameSchema.safeParse(name);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty names', () => {
      const result = organizationNameSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject names longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = organizationNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace', () => {
      const result = organizationNameSchema.parse('  Acme Corp  ');
      expect(result).toBe('Acme Corp');
    });
  });
});

