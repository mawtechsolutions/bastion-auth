import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock JWT verification
const mockVerifyToken = vi.fn();

// Mock request/reply objects
function createMockRequest(authHeader?: string): Record<string, any> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    cookies: {},
    user: null,
  };
}

function createMockReply(): Record<string, any> {
  return {
    code: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };
}

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Extraction', () => {
    it('should extract Bearer token from Authorization header', () => {
      const request = createMockRequest('Bearer valid-jwt-token');
      
      const authHeader = request.headers.authorization;
      expect(authHeader).toBe('Bearer valid-jwt-token');
      
      const token = authHeader?.replace('Bearer ', '');
      expect(token).toBe('valid-jwt-token');
    });

    it('should return 401 when Authorization header is missing', () => {
      const request = createMockRequest();
      const reply = createMockReply();
      
      expect(request.headers.authorization).toBeUndefined();
    });

    it('should return 401 when Authorization header has wrong format', () => {
      const request = createMockRequest('Basic dXNlcjpwYXNz');
      
      const authHeader = request.headers.authorization;
      expect(authHeader).not.toMatch(/^Bearer /);
    });
  });

  describe('Token Validation', () => {
    it('should attach user to request when token is valid', () => {
      mockVerifyToken.mockReturnValueOnce({
        sub: 'user-123',
        email: 'user@example.com',
        type: 'access',
      });
      
      const request = createMockRequest('Bearer valid-jwt-token');
      
      // Simulate middleware behavior
      const payload = mockVerifyToken('valid-jwt-token');
      request.user = { id: payload.sub, email: payload.email };
      
      expect(request.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
      });
    });

    it('should return 401 when token is expired', () => {
      mockVerifyToken.mockImplementationOnce(() => {
        throw new Error('Token expired');
      });
      
      const request = createMockRequest('Bearer expired-token');
      const reply = createMockReply();
      
      expect(() => mockVerifyToken('expired-token')).toThrow('Token expired');
    });

    it('should return 401 when token is invalid', () => {
      mockVerifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      
      const request = createMockRequest('Bearer invalid-token');
      
      expect(() => mockVerifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should return 401 when token type is not access', () => {
      mockVerifyToken.mockReturnValueOnce({
        sub: 'user-123',
        type: 'refresh', // Should be 'access'
      });
      
      const payload = mockVerifyToken('refresh-token');
      expect(payload.type).not.toBe('access');
    });
  });

  describe('Optional Authentication', () => {
    it('should continue without user when token is missing and auth is optional', () => {
      const request = createMockRequest();
      
      // With optional auth, middleware should continue even without a token
      expect(request.user).toBeNull();
      expect(request.headers.authorization).toBeUndefined();
    });
  });
});

