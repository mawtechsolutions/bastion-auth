/**
 * BastionAuth - Concurrent Sessions Load Test
 * 
 * This script tests how the system handles many concurrent sessions
 * for the same user (multi-device scenario).
 * 
 * Usage:
 *   k6 run tests/load/concurrent-sessions.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const sessionCreationDuration = new Trend('session_creation_duration', true);
const concurrentRequestDuration = new Trend('concurrent_request_duration', true);
const sessionConflicts = new Counter('session_conflicts');
const successRate = new Rate('success_rate');

// Test options
export const options = {
  scenarios: {
    // Multiple VUs per user - simulating multi-device usage
    concurrent_sessions: {
      executor: 'per-vu-iterations',
      vus: 50,  // 50 VUs
      iterations: 20,  // Each VU does 20 iterations
      maxDuration: '10m',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    session_creation_duration: ['p(95)<800'],
    concurrent_request_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    success_rate: ['rate>0.90'],
  },
  
  tags: {
    testType: 'concurrent-sessions',
    service: 'bastionauth',
  },
};

// Test users - multiple VUs will use the same users
const TEST_USERS = [
  { email: 'concurrent-1@example.com', password: 'Concurrent123!' },
  { email: 'concurrent-2@example.com', password: 'Concurrent123!' },
  { email: 'concurrent-3@example.com', password: 'Concurrent123!' },
  { email: 'concurrent-4@example.com', password: 'Concurrent123!' },
  { email: 'concurrent-5@example.com', password: 'Concurrent123!' },
];

export function setup() {
  console.log('Setting up concurrent sessions test...');
  
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
      firstName: 'Concurrent',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  console.log('Test users created');
  
  return { users: TEST_USERS };
}

export default function(data) {
  // Each VU picks a user - multiple VUs may pick the same user
  const userIndex = __VU % data.users.length;
  const user = data.users[userIndex];
  const deviceId = `device-${__VU}-${__ITER}`;
  
  let accessToken = null;
  
  group('Create Session (Sign In)', () => {
    const startTime = Date.now();
    
    const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'User-Agent': `k6-load-test/${deviceId}`,
      },
      tags: { name: 'concurrent-sign-in' },
    });
    
    sessionCreationDuration.add(Date.now() - startTime);
    
    const success = check(signInRes, {
      'sign-in successful': (r) => r.status === 200,
      'tokens received': (r) => r.json('tokens.accessToken') !== null,
    });
    
    successRate.add(success);
    
    if (success) {
      accessToken = signInRes.json('tokens.accessToken');
    } else if (signInRes.status === 429) {
      // Rate limited - expected with many concurrent sign-ins
      sessionConflicts.add(1);
    }
  });
  
  // Make concurrent requests with the session
  if (accessToken) {
    group('Concurrent Authenticated Requests', () => {
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
      
      // Multiple rapid requests from same session
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        const meRes = http.get(`${API_URL}/users/me`, {
          headers,
          tags: { name: 'concurrent-get-me' },
        });
        
        concurrentRequestDuration.add(Date.now() - startTime);
        
        const success = check(meRes, {
          'request successful': (r) => r.status === 200,
          'email matches': (r) => r.json('email') === user.email,
        });
        
        successRate.add(success);
        
        // Very short sleep between requests
        sleep(0.1);
      }
    });
    
    // Occasionally sign out
    if (Math.random() < 0.3) {
      group('Sign Out Session', () => {
        const signOutRes = http.post(`${API_URL}/auth/sign-out`, JSON.stringify({}), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'concurrent-sign-out' },
        });
        
        check(signOutRes, {
          'sign-out successful': (r) => r.status === 200,
        });
      });
    }
  }
  
  sleep(0.5 + Math.random());
}

export function teardown(data) {
  console.log('Concurrent sessions test completed.');
  console.log(`Session conflicts/rate limits: ${sessionConflicts}`);
}

