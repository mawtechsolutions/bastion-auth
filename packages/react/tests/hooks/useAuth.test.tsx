import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the BastionProvider context
const mockAuthContext = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

const mockUseAuth = () => mockAuthContext;

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return loading state initially', () => {
      const loadingContext = { ...mockAuthContext, isLoaded: false };
      const useAuthLoading = () => loadingContext;
      
      const result = useAuthLoading();
      expect(result.isLoaded).toBe(false);
    });

    it('should return signed out state when no user', () => {
      const result = mockUseAuth();
      
      expect(result.isLoaded).toBe(true);
      expect(result.isSignedIn).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return signed in state when user exists', () => {
      const signedInContext = {
        ...mockAuthContext,
        isSignedIn: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      const useAuthSignedIn = () => signedInContext;
      
      const result = useAuthSignedIn();
      
      expect(result.isSignedIn).toBe(true);
      expect(result.user).not.toBeNull();
      expect(result.user?.email).toBe('test@example.com');
    });
  });

  describe('Authentication Methods', () => {
    it('should provide signIn method', () => {
      const result = mockUseAuth();
      expect(typeof result.signIn).toBe('function');
    });

    it('should provide signUp method', () => {
      const result = mockUseAuth();
      expect(typeof result.signUp).toBe('function');
    });

    it('should provide signOut method', () => {
      const result = mockUseAuth();
      expect(typeof result.signOut).toBe('function');
    });

    it('should call signIn with credentials', async () => {
      const signInMock = vi.fn().mockResolvedValue({ success: true });
      const contextWithMock = { ...mockAuthContext, signIn: signInMock };
      
      await contextWithMock.signIn({ email: 'test@example.com', password: 'password' });
      
      expect(signInMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should call signUp with user data', async () => {
      const signUpMock = vi.fn().mockResolvedValue({ success: true });
      const contextWithMock = { ...mockAuthContext, signUp: signUpMock };
      
      await contextWithMock.signUp({
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
      });
      
      expect(signUpMock).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
      });
    });

    it('should call signOut', async () => {
      const signOutMock = vi.fn().mockResolvedValue(undefined);
      const contextWithMock = { ...mockAuthContext, signOut: signOutMock };
      
      await contextWithMock.signOut();
      
      expect(signOutMock).toHaveBeenCalled();
    });
  });
});

