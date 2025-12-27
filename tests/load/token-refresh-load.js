/**
 * BastionAuth - Token Refresh Load Test
 * 
 * This script tests the token refresh mechanism under load.
 * Critical for maintaining session availability during high traffic.
 * 
 * Usage:
 *   k6 run tests/load/token-refresh-load.js
 *   k6 run --vus 100 --duration 10m tests/load/token-refresh-load.js
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const tokenRefreshDuration = new Trend('token_refresh_duration', true);
const authenticatedRequestDuration = new Trend('authenticated_request_duration', true);
const refreshFailures = new Counter('refresh_failures');
const successRate = new Rate('success_rate');
const tokenRotations = new Counter('token_rotations');

// Test options
export const options = {
  scenarios: {
    // Continuous token refresh simulation
    token_refresh: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    token_refresh_duration: ['p(95)<300', 'avg<150'],
    authenticated_request_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.02'],
    success_rate: ['rate>0.95'],
  },
  
  tags: {
    testType: 'token-refresh',
    service: 'bastionauth',
  },
};

// Test users
const TEST_USERS = [
  { email: 'refresh-test-1@example.com', password: 'RefreshTest123!' },
  { email: 'refresh-test-2@example.com', password: 'RefreshTest123!' },
  { email: 'refresh-test-3@example.com', password: 'RefreshTest123!' },
  { email: 'refresh-test-4@example.com', password: 'RefreshTest123!' },
  { email: 'refresh-test-5@example.com', password: 'RefreshTest123!' },
];

// Store tokens per VU
let vuTokens = {};

export function setup() {
  console.log('Setting up token refresh load test...');
  
  // Verify API health
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error('API is not healthy');
  }
  
  // Create test users
  TEST_USERS.forEach(user => {
    http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: 'Refresh',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  return { users: TEST_USERS };
}

export default function(data) {
  const vuId = __VU;
  const user = data.users[vuId % data.users.length];
  
  group('Token Lifecycle', () => {
    // Get or refresh token
    if (!vuTokens[vuId] || !vuTokens[vuId].accessToken) {
      // Initial sign-in
      group('Initial Sign In', () => {
        const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
          email: user.email,
          password: user.password,
        }), {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'sign-in' },
        });
        
        const signInOk = check(signInRes, {
          'sign-in successful': (r) => r.status === 200,
        });
        
        if (signInOk) {
          const body = signInRes.json();
          vuTokens[vuId] = {
            accessToken: body.tokens?.accessToken,
            signInTime: Date.now(),
            refreshCount: 0,
          };
        }
      });
    }
    
    // Make authenticated request
    if (vuTokens[vuId]?.accessToken) {
      group('Authenticated Request', () => {
        const authStart = Date.now();
        
        const meRes = http.get(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${vuTokens[vuId].accessToken}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'get-me' },
        });
        
        authenticatedRequestDuration.add(Date.now() - authStart);
        
        const authOk = check(meRes, {
          'authenticated request OK': (r) => r.status === 200,
        });
        
        successRate.add(authOk);
        
        // If unauthorized, trigger refresh
        if (meRes.status === 401) {
          group('Token Refresh', () => {
            const refreshStart = Date.now();
            
            const refreshRes = http.post(`${API_URL}/auth/refresh`, JSON.stringify({}), {
              headers: { 'Content-Type': 'application/json' },
              tags: { name: 'token-refresh' },
            });
            
            tokenRefreshDuration.add(Date.now() - refreshStart);
            
            const refreshOk = check(refreshRes, {
              'refresh successful': (r) => r.status === 200,
              'new token received': (r) => r.json('accessToken') !== null,
            });
            
            if (refreshOk) {
              const newToken = refreshRes.json('accessToken');
              vuTokens[vuId].accessToken = newToken;
              vuTokens[vuId].refreshCount++;
              tokenRotations.add(1);
            } else {
              refreshFailures.add(1);
              // Clear tokens to force re-auth
              vuTokens[vuId] = null;
            }
          });
        }
      });
      
      // Simulate token refresh every few iterations (before expiry)
      if (vuTokens[vuId]?.refreshCount < 5 && Math.random() < 0.1) {
        group('Proactive Token Refresh', () => {
          const refreshStart = Date.now();
          
          const refreshRes = http.post(`${API_URL}/auth/refresh`, JSON.stringify({}), {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'proactive-refresh' },
          });
          
          tokenRefreshDuration.add(Date.now() - refreshStart);
          
          if (refreshRes.status === 200) {
            const newToken = refreshRes.json('accessToken');
            if (newToken) {
              vuTokens[vuId].accessToken = newToken;
              vuTokens[vuId].refreshCount++;
              tokenRotations.add(1);
            }
          }
        });
      }
    }
  });
  
  sleep(0.5 + Math.random());
}

export function teardown(data) {
  console.log('Token refresh load test completed.');
  console.log(`Total token rotations: ${tokenRotations}`);
}

