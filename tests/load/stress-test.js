/**
 * BastionAuth - Stress Test
 * 
 * This script tests the system's limits by gradually increasing load
 * until the system starts to fail or degrade significantly.
 * 
 * Usage:
 *   k6 run tests/load/stress-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const requestDuration = new Trend('request_duration', true);
const errorCount = new Counter('errors');
const successRate = new Rate('success_rate');

// Stress test options
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Ramp to 50 users
    { duration: '5m', target: 50 },    // Hold at 50
    { duration: '2m', target: 100 },   // Ramp to 100
    { duration: '5m', target: 100 },   // Hold at 100
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '5m', target: 200 },   // Hold at 200
    { duration: '2m', target: 300 },   // Ramp to 300
    { duration: '5m', target: 300 },   // Hold at 300
    { duration: '5m', target: 0 },     // Ramp down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<2000'],   // 95% < 2s under stress
    http_req_failed: ['rate<0.10'],      // Allow up to 10% error rate
    success_rate: ['rate>0.80'],         // 80% success rate minimum
  },
  
  tags: {
    testType: 'stress',
    service: 'bastionauth',
  },
};

// Generate unique email for each VU
function generateEmail() {
  return `stress-${__VU}-${Date.now()}@test.com`;
}

export default function() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    
    check(res, {
      'health check passes': (r) => r.status === 200,
    });
  });
  
  group('Sign Up Stress', () => {
    const email = generateEmail();
    const startTime = Date.now();
    
    const res = http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
      email: email,
      password: 'StressTest123!',
      firstName: 'Stress',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'sign-up' },
    });
    
    requestDuration.add(Date.now() - startTime);
    
    const success = check(res, {
      'sign-up succeeds': (r) => r.status === 201 || r.status === 409, // 409 = already exists
      'response time OK': (r) => r.timings.duration < 2000,
    });
    
    successRate.add(success);
    if (!success) {
      errorCount.add(1);
      console.log(`Sign-up failed: ${res.status} - ${res.body}`);
    }
  });
  
  group('Sign In Stress', () => {
    const startTime = Date.now();
    
    // Try to sign in with a test account
    const res = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
      email: 'stresstest@example.com',
      password: 'StressTest123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'sign-in' },
    });
    
    requestDuration.add(Date.now() - startTime);
    
    const success = check(res, {
      'sign-in completes': (r) => r.status === 200 || r.status === 401,
      'response time OK': (r) => r.timings.duration < 2000,
    });
    
    successRate.add(success);
    if (!success) {
      errorCount.add(1);
    }
  });
  
  group('Password Reset Stress', () => {
    const startTime = Date.now();
    
    const res = http.post(`${API_URL}/auth/password/forgot`, JSON.stringify({
      email: `stress-${__VU}@example.com`,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'password-forgot' },
    });
    
    requestDuration.add(Date.now() - startTime);
    
    // This might be rate limited, which is expected
    const success = check(res, {
      'password reset completes': (r) => r.status === 200 || r.status === 429,
      'response time OK': (r) => r.timings.duration < 2000,
    });
    
    successRate.add(success);
  });
  
  sleep(0.5 + Math.random()); // Short sleep for stress test
}

export function setup() {
  console.log('Starting stress test...');
  
  // Create a test user for sign-in tests
  http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
    email: 'stresstest@example.com',
    password: 'StressTest123!',
    firstName: 'Stress',
    lastName: 'Test',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function teardown() {
  console.log('Stress test completed.');
}


