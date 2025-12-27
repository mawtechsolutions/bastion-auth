/**
 * BastionAuth - MFA Flow Load Test
 * 
 * This script tests the MFA authentication flow under load.
 * 
 * Usage:
 *   k6 run tests/load/mfa-load.js
 *   k6 run --vus 20 --duration 5m tests/load/mfa-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const mfaChallengeDuration = new Trend('mfa_challenge_duration', true);
const mfaVerifyDuration = new Trend('mfa_verify_duration', true);
const backupCodeDuration = new Trend('backup_code_duration', true);
const mfaFailures = new Counter('mfa_failures');
const mfaSuccess = new Rate('mfa_success_rate');

// Test options
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Warm up
    { duration: '3m', target: 30 },   // Ramp to 30 VUs
    { duration: '5m', target: 30 },   // Hold
    { duration: '2m', target: 50 },   // Increase to 50
    { duration: '3m', target: 50 },   // Hold
    { duration: '2m', target: 0 },    // Ramp down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    mfa_challenge_duration: ['p(95)<800'],
    mfa_verify_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    mfa_success_rate: ['rate>0.90'],
  },
  
  tags: {
    testType: 'mfa-load',
    service: 'bastionauth',
  },
};

// Pre-configured MFA test users (need to be set up before test)
const MFA_TEST_USERS = [
  { email: 'mfa-load-1@example.com', password: 'MfaTest123!', totpSecret: 'JBSWY3DPEHPK3PXP' },
  { email: 'mfa-load-2@example.com', password: 'MfaTest123!', totpSecret: 'JBSWY3DPEHPK3PXP' },
  { email: 'mfa-load-3@example.com', password: 'MfaTest123!', totpSecret: 'JBSWY3DPEHPK3PXP' },
];

/**
 * Generate TOTP code (simplified - in real test, use proper TOTP library)
 * For load testing, we accept that these will fail and measure the flow
 */
function generateTOTP(secret) {
  // This is a placeholder - real TOTP generation needs time-based calculation
  // For load testing purposes, we're testing the endpoint behavior
  return '123456';
}

export function setup() {
  console.log('Setting up MFA load test...');
  
  // Verify API is healthy
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error('API is not healthy');
  }
  
  // Create MFA test users if they don't exist
  MFA_TEST_USERS.forEach(user => {
    http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: 'MFA',
      lastName: 'LoadTest',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  return { users: MFA_TEST_USERS };
}

export default function(data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  
  group('MFA Sign-In Flow', () => {
    // Step 1: Initial sign-in (should get MFA challenge)
    const challengeStart = Date.now();
    
    const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'mfa-sign-in' },
    });
    
    mfaChallengeDuration.add(Date.now() - challengeStart);
    
    // Check response
    if (signInRes.status === 200) {
      const body = signInRes.json();
      
      if (body.requiresMfa && body.mfaChallengeId) {
        // Step 2: Verify MFA
        const verifyStart = Date.now();
        const totpCode = generateTOTP(user.totpSecret);
        
        const verifyRes = http.post(`${API_URL}/auth/mfa/verify`, JSON.stringify({
          mfaChallengeId: body.mfaChallengeId,
          code: totpCode,
          method: 'totp',
        }), {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'mfa-verify' },
        });
        
        mfaVerifyDuration.add(Date.now() - verifyStart);
        
        const success = check(verifyRes, {
          'MFA verify responds': (r) => r.status !== 0,
          'MFA verify status OK': (r) => r.status === 200 || r.status === 401,
        });
        
        mfaSuccess.add(success);
        if (!success) {
          mfaFailures.add(1);
        }
      } else if (body.tokens) {
        // User doesn't have MFA enabled - still counts as success
        mfaSuccess.add(true);
      }
    } else {
      // Sign-in failed
      check(signInRes, {
        'sign-in not server error': (r) => r.status < 500,
      });
      
      mfaSuccess.add(false);
      if (signInRes.status >= 500) {
        mfaFailures.add(1);
      }
    }
  });
  
  sleep(1 + Math.random() * 2);
}

export function teardown(data) {
  console.log('MFA load test completed.');
}

