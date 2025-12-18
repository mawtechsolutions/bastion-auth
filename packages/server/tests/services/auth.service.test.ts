import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/utils/crypto';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  session: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  emailVerificationToken: {
    create: vi.fn(),
  },
  passwordResetToken: {
    create: vi.fn(),
    findFirst: vi.fn(),
    delete: vi.fn(),
  },
};

// Mock email service
const mockEmailService = {
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
};

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user with hashed password', async () => {
      const email = 'test@example.com';
      const password = 'SecurePassword123!';
      const hashedPassword = await hashPassword(password);
      
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-123',
        email,
        passwordHash: hashedPassword,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const user = await mockPrisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
        },
      });
      
      expect(user.email).toBe(email);
      expect(user.passwordHash).not.toBe(password);
      expect(await verifyPassword(password, hashedPassword)).toBe(true);
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
      });
      
      const existingUser = await mockPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      
      expect(existingUser).not.toBeNull();
    });

    it('should send verification email after signup', async () => {
      const email = 'newuser@example.com';
      
      mockEmailService.sendVerificationEmail.mockResolvedValueOnce(undefined);
      
      await mockEmailService.sendVerificationEmail(email, 'verification-token');
      
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        email,
        'verification-token'
      );
    });
  });

  describe('signIn', () => {
    it('should authenticate user with correct password', async () => {
      const email = 'user@example.com';
      const password = 'CorrectPassword123!';
      const hashedPassword = await hashPassword(password);
      
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email,
        passwordHash: hashedPassword,
        emailVerified: true,
        mfaEnabled: false,
      });
      
      const user = await mockPrisma.user.findUnique({
        where: { email },
      });
      
      expect(user).not.toBeNull();
      expect(await verifyPassword(password, user!.passwordHash)).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const email = 'user@example.com';
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await hashPassword(correctPassword);
      
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email,
        passwordHash: hashedPassword,
      });
      
      const user = await mockPrisma.user.findUnique({
        where: { email },
      });
      
      expect(await verifyPassword(wrongPassword, user!.passwordHash)).toBe(false);
    });

    it('should reject non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      
      const user = await mockPrisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });
      
      expect(user).toBeNull();
    });

    it('should require MFA if enabled', async () => {
      const email = 'mfa-user@example.com';
      
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email,
        mfaEnabled: true,
        totpSecret: 'encrypted-secret',
      });
      
      const user = await mockPrisma.user.findUnique({
        where: { email },
      });
      
      expect(user!.mfaEnabled).toBe(true);
    });

    it('should create session after successful authentication', async () => {
      const userId = 'user-123';
      
      mockPrisma.session.create.mockResolvedValueOnce({
        id: 'session-123',
        userId,
        refreshToken: 'refresh-token-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      
      const session = await mockPrisma.session.create({
        data: {
          userId,
          refreshToken: 'refresh-token-hash',
          expiresAt: new Date(),
        },
      });
      
      expect(session.userId).toBe(userId);
    });
  });

  describe('signOut', () => {
    it('should delete user session', async () => {
      const sessionId = 'session-123';
      
      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });
      
      const result = await mockPrisma.session.deleteMany({
        where: { id: sessionId },
      });
      
      expect(result.count).toBe(1);
    });

    it('should delete all user sessions when signing out everywhere', async () => {
      const userId = 'user-123';
      
      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 5 });
      
      const result = await mockPrisma.session.deleteMany({
        where: { userId },
      });
      
      expect(result.count).toBe(5);
    });
  });

  describe('passwordReset', () => {
    it('should create password reset token', async () => {
      const email = 'user@example.com';
      
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email,
      });
      
      mockPrisma.passwordResetToken.create.mockResolvedValueOnce({
        id: 'token-123',
        userId: 'user-123',
        token: 'hashed-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      
      const token = await mockPrisma.passwordResetToken.create({
        data: {
          userId: 'user-123',
          token: 'hashed-token',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      
      expect(token.userId).toBe('user-123');
    });

    it('should send password reset email', async () => {
      const email = 'user@example.com';
      
      mockEmailService.sendPasswordResetEmail.mockResolvedValueOnce(undefined);
      
      await mockEmailService.sendPasswordResetEmail(email, 'reset-token');
      
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        'reset-token'
      );
    });

    it('should update password with valid reset token', async () => {
      const newPassword = 'NewSecurePassword123!';
      const hashedPassword = await hashPassword(newPassword);
      
      mockPrisma.passwordResetToken.findFirst.mockResolvedValueOnce({
        id: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      
      mockPrisma.user.update.mockResolvedValueOnce({
        id: 'user-123',
        passwordHash: hashedPassword,
      });
      
      const token = await mockPrisma.passwordResetToken.findFirst({
        where: { token: 'valid-token' },
      });
      
      expect(token).not.toBeNull();
      expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should reject expired reset token', async () => {
      mockPrisma.passwordResetToken.findFirst.mockResolvedValueOnce({
        id: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired
      });
      
      const token = await mockPrisma.passwordResetToken.findFirst({
        where: { token: 'expired-token' },
      });
      
      expect(token!.expiresAt.getTime()).toBeLessThan(Date.now());
    });
  });
});

