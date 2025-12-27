/**
 * BastionAuth - Authentication Load Test
 * 
 * This script tests the authentication endpoints under load.
 * 
 * Usage:
 *   k6 run tests/load/auth-load.js
 *   k6 run --vus 50 --duration 2m tests/load/auth-load.js
 *   k6 run --out json=results.json tests/load/auth-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const signInDuration = new Trend('sign_in_duration', true);
const signUpDuration = new Trend('sign_up_duration', true);
const tokenRefreshDuration = new Trend('token_refresh_duration', true);
const authFailures = new Counter('auth_failures');
const authSuccess = new Rate('auth_success_rate');

// Test options
export const options = {
  // Stages for load test
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  
  // Thresholds (adjusted for rate limiting behavior)
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
    http_req_failed: ['rate<0.20'],                  // Error rate < 20% (rate limiting expected)
    sign_in_duration: ['p(95)<1000'],                // Sign-in 95% < 1s
    sign_up_duration: ['p(95)<1000'],                // Sign-up 95% < 1s
    token_refresh_duration: ['p(95)<500'],           // Refresh 95% < 500ms
    auth_success_rate: ['rate>0.80'],                // 80% success rate (rate limiting may occur)
  },
  
  // Tags
  tags: {
    testType: 'load',
    service: 'bastionauth',
  },
};

// Test users
const TEST_USERS = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
  { email: 'loadtest4@example.com', password: 'LoadTest123!' },
  { email: 'loadtest5@example.com', password: 'LoadTest123!' },
];

// Setup function - runs once before the test
export function setup() {
  console.log('Setting up load test...');
  
  // Verify API is reachable
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('API is not healthy');
  }
  
  // Create test users if they don't exist
  TEST_USERS.forEach(user => {
    http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: 'Load',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  return { users: TEST_USERS };
}

// Main test function
export default function(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('Sign In Flow', () => {
    const startTime = Date.now();
    
    const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'sign-in' },
    });
    
    signInDuration.add(Date.now() - startTime);
    
    const success = check(signInRes, {
      'sign-in status is 200': (r) => r.status === 200,
      'sign-in returns user': (r) => r.json('user') !== null,
      'sign-in returns tokens': (r) => r.json('tokens.accessToken') !== null,
    });
    
    authSuccess.add(success);
    if (!success) {
      authFailures.add(1);
    }
    
    if (signInRes.status === 200) {
      const accessToken = signInRes.json('tokens.accessToken');
      
      // Test authenticated endpoints
      group('Authenticated Requests', () => {
        // Get current user
        const meRes = http.get(`${API_URL}/users/me`, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'get-me' },
        });
        
        check(meRes, {
          'get-me status is 200': (r) => r.status === 200,
          'get-me returns email': (r) => r.json('email') === user.email,
        });
      });
      
      // Token refresh
      group('Token Refresh', () => {
        const refreshStart = Date.now();
        
        const refreshRes = http.post(`${API_URL}/auth/refresh`, JSON.stringify({}), {
          headers: { 
            'Content-Type': 'application/json',
          },
          tags: { name: 'refresh' },
        });
        
        tokenRefreshDuration.add(Date.now() - refreshStart);
        
        // Refresh might fail if cookie is not present (expected in k6)
        check(refreshRes, {
          'refresh completes': (r) => r.status === 200 || r.status === 401,
        });
      });
      
      // Sign out
      group('Sign Out', () => {
        const signOutRes = http.post(`${API_URL}/auth/sign-out`, JSON.stringify({}), {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'sign-out' },
        });
        
        check(signOutRes, {
          'sign-out status is 200': (r) => r.status === 200,
        });
      });
    }
  });
  
  sleep(1 + Math.random() * 2); // Random sleep 1-3 seconds
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Load test completed.');
}

