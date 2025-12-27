import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables for testing - MUST match env.ts schema
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/bastionauth_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// JWT keys (test keys - DO NOT use in production)
process.env.JWT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA2Z3qX2BTLS4e0ek55tN2I5gEpkT0o7TqXGI2CvBT1PBC1xnz
wljbMyvVPULJR9KK4NoQiYxP7g7i1jtBlxzKfgzGPFxN+dXo1wqSB2J3xMjXLWVq
tXpK4nOV0v5VsXxKAaQDTN5lJjL2xoN6wP5kN1qN7pkT7N0xZbizxP1lL4bKb+kv
+pXDdP9LbqXvplJ5dMCbKmB5MWzLqRGGnTpmVblT3Z7wLvXmKLgmT6N14EblGMCu
wMplxqTEVmUMmAuGmKRyUTFNDJcapL2XxKKVnEpXMcKlAHC8d8V5eD3AveDzkf7N
zxS+BNF3M8dQn3ZRwMT6RlO8L3QXSV1V4VlX5QIDAQABAoIBAC5RgZ+hBx7xHnFZ
nQmY2LOco5VYkhLR+SYLXVtCVjqmX/6umjfDQ7R4f6aZ9F5vJV1VAtXbQp6Kdbmy
QDugDLh3dJRQeNEakVFf3aN8HIitm+t4i0lKsOWLCDjPElqNwMgn+1o+NAL3f/OO
sNLQQcqD5AYY7RwNFjYTQfyYXa9IbN9jhRmGLhTwVlMHOlpg7n6tZqWmqwcKXOX4
XH1rFQhVmV7VOLdP5RrZfJ4vZO4WJ0kO6R5h/wdXLV5YT7P5J1T5eLMKfKLBzxEh
xyZ9xPV7V5LxEj6v3jfZM9T7Fxl0lZe0MsQVpaYf3Jl0bm+1Uee9J0lHU16f4k1G
lZstKYECgYEA7/l6U8RDQPQ1yfNpVbeP5H1nH1e1AEq5gPxJGvX6Ai0xF1NeElVq
uXvMvNdPuSqQ9KRp/VrZ7D3VhGmSLM3tXB5XCaIJEoS0hLqd7N7dB1Y5UOCfqCrK
pN7QvJLBuL6ORmRbQ/mZ3/rWxnxKmHCrHqI9RNQPVxGr7IKVD7qIhf0CgYEA5sQz
BKOPHxJADFK3D6x2e3e8B5LZS0IVeJXfCgN5vGYHRpvCR0u7j6B7V5H8BXWQGCQV
kMnRLbw9D9EBDzy6u2C6Jc8Z9wB+CJSKB7V9QAUq9gVuC8sMn3P6XnvBH3nTJJlP
j0bS9T5tPRWL6GC8JFZ7L9BvxLmfxNbq5uGYhYECgYEA0y8iU0F1O+l3+7VGJLJL
MK9LbLqZZBQU9JpjLbKPq1jC+HVkBFSf3PpxF7AXS7V8XKHC2bf4hXB2+b6ZZL6D
VQpGU9gZ8LZ7n8dQAB9jhq8K6i5VMLJ2LQTyMhkkBnuTLlNW+bXJKJM/0o97CYXM
2pV8LbNjMvXpp/MpO7Y1Y20CgYBZAP4x5xY7U3Bd+k6wZsC9w2LXKL3m3qV9XRLZ
BfJLQbxQm4F5MZR9GKvpqJg9MH3dH5B3BJm8fC3XM8JHMBrNaE4ZqGMKkSQQfbxK
3TqAaQWLXhL0q7d9J6B3DLWP+x2RQo7k6FY3xMl6QJQT3BYBi1S3x6MqP/xZ2v0R
/NhgAQKBgQCQqpP8gVJV9q9N0FLqJHYCPu4HBcZ8XwPQwVNJlj3PZ7e/cF5vqJGM
qZ3e3OTZ7vFVxHl/Bq1H5D3L5dLm7MN2V5VjG1m3Q6K2VK3P7kH7HjPL3z9qLW6T
vnST7LnhB1vKlN4l5mCXLvMlAKfQ3qJhviM6lN5gD+IxKP0SbL9yAQ==
-----END RSA PRIVATE KEY-----`;

process.env.JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Z3qX2BTLS4e0ek55tN2
I5gEpkT0o7TqXGI2CvBT1PBC1xnzwljbMyvVPULJR9KK4NoQiYxP7g7i1jtBlxzK
fgzGPFxN+dXo1wqSB2J3xMjXLWVqtXpK4nOV0v5VsXxKAaQDTN5lJjL2xoN6wP5k
N1qN7pkT7N0xZbizxP1lL4bKb+kv+pXDdP9LbqXvplJ5dMCbKmB5MWzLqRGGnTpm
VblT3Z7wLvXmKLgmT6N14EblGMCuwMplxqTEVmUMmAuGmKRyUTFNDJcapL2XxKKV
nEpXMcKlAHC8d8V5eD3AveDzkf7NzxS+BNF3M8dQn3ZRwMT6RlO8L3QXSV1V4VlX
5QIDAQAB
-----END PUBLIC KEY-----`;

// 64-character hex string (32 bytes) for AES-256 encryption
process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

// CSRF secret (minimum 32 characters)
process.env.CSRF_SECRET = 'test-csrf-secret-must-be-at-least-32-characters-long';

process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.EMAIL_FROM = 'noreply@test.bastionauth.dev';
process.env.API_URL = 'http://localhost:3001';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ADMIN_URL = 'http://localhost:3002';

// Mock fetch for external API calls
global.fetch = vi.fn();

beforeAll(() => {
  // Setup before all tests
});

afterAll(() => {
  // Cleanup after all tests
  vi.restoreAllMocks();
});

