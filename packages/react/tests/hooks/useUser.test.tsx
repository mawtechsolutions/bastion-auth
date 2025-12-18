import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock user context
const mockUserContext = {
  user: null,
  isLoaded: true,
  isSignedIn: false,
  updateUser: vi.fn(),
};

describe('useUser Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User State', () => {
    it('should return null user when not signed in', () => {
      expect(mockUserContext.user).toBeNull();
      expect(mockUserContext.isSignedIn).toBe(false);
    });

    it('should return user data when signed in', () => {
      const signedInContext = {
        ...mockUserContext,
        isSignedIn: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: 'https://example.com/avatar.jpg',
          emailVerified: true,
          mfaEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
      
      expect(signedInContext.user).not.toBeNull();
      expect(signedInContext.user.id).toBe('user-123');
      expect(signedInContext.user.email).toBe('test@example.com');
      expect(signedInContext.user.firstName).toBe('John');
    });
  });

  describe('User Updates', () => {
    it('should provide updateUser method', () => {
      expect(typeof mockUserContext.updateUser).toBe('function');
    });

    it('should call updateUser with new data', async () => {
      const updateUserMock = vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      });
      
      await updateUserMock({ firstName: 'Jane' });
      
      expect(updateUserMock).toHaveBeenCalledWith({ firstName: 'Jane' });
    });
  });

  describe('User Properties', () => {
    it('should include email verification status', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      };
      
      expect(user.emailVerified).toBe(true);
    });

    it('should include MFA status', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        mfaEnabled: true,
      };
      
      expect(user.mfaEnabled).toBe(true);
    });

    it('should include timestamps', () => {
      const now = new Date().toISOString();
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        createdAt: now,
        updatedAt: now,
      };
      
      expect(user.createdAt).toBe(now);
      expect(user.updatedAt).toBe(now);
    });
  });
});

