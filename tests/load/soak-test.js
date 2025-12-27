/**
 * BastionAuth - Soak Test
 * 
 * This script runs a sustained load over an extended period to detect
 * memory leaks, connection pool exhaustion, and gradual performance degradation.
 * 
 * Usage:
 *   k6 run tests/load/soak-test.js
 *   k6 run --duration 2h tests/load/soak-test.js  # Extended soak
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const requestDuration = new Trend('request_duration', true);
const authDuration = new Trend('auth_duration', true);
const errorCount = new Counter('errors');
const successRate = new Rate('success_rate');
const memoryWarnings = new Counter('memory_warnings');
const healthStatus = new Gauge('health_status');

// Soak test options - sustained moderate load
export const options = {
  stages: [
    { duration: '5m', target: 30 },   // Ramp to steady state
    { duration: '50m', target: 30 },  // Hold for soak period (adjust as needed)
    { duration: '5m', target: 0 },    // Ramp down
  ],
  
  thresholds: {
    // Stricter thresholds - soak should be stable
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    auth_duration: ['p(95)<600'],
    http_req_failed: ['rate<0.01'],  // 1% error rate max
    success_rate: ['rate>0.98'],     // 98% success rate
  },
  
  tags: {
    testType: 'soak',
    service: 'bastionauth',
  },
};

// Test users
const SOAK_USERS = [
  { email: 'soak-1@example.com', password: 'SoakTest123!' },
  { email: 'soak-2@example.com', password: 'SoakTest123!' },
  { email: 'soak-3@example.com', password: 'SoakTest123!' },
  { email: 'soak-4@example.com', password: 'SoakTest123!' },
  { email: 'soak-5@example.com', password: 'SoakTest123!' },
  { email: 'soak-6@example.com', password: 'SoakTest123!' },
  { email: 'soak-7@example.com', password: 'SoakTest123!' },
  { email: 'soak-8@example.com', password: 'SoakTest123!' },
  { email: 'soak-9@example.com', password: 'SoakTest123!' },
  { email: 'soak-10@example.com', password: 'SoakTest123!' },
];

// Track VU state
let vuTokens = {};
let iterationCount = {};

export function setup() {
  console.log('Starting soak test...');
  console.log('This test will run for an extended period to detect stability issues.');
  
  // Verify API health
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error('API is not healthy');
  }
  
  // Create test users
  SOAK_USERS.forEach(user => {
    http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
      email: user.email,
      password: user.password,
      firstName: 'Soak',
      lastName: 'Test',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  
  return { 
    users: SOAK_USERS,
    startTime: Date.now(),
  };
}

export default function(data) {
  const vuId = __VU;
  const user = data.users[vuId % data.users.length];
  
  // Track iterations
  iterationCount[vuId] = (iterationCount[vuId] || 0) + 1;
  
  // Periodic health check
  if (iterationCount[vuId] % 10 === 0) {
    group('Health Monitoring', () => {
      const healthRes = http.get(`${BASE_URL}/health`);
      
      const healthy = check(healthRes, {
        'system healthy': (r) => r.status === 200,
        'response time OK': (r) => r.timings.duration < 1000,
      });
      
      healthStatus.add(healthy ? 1 : 0);
      
      if (healthRes.status === 200) {
        const body = healthRes.json();
        
        // Check for degraded state
        if (body.status === 'degraded') {
          memoryWarnings.add(1);
          console.log(`[${new Date().toISOString()}] System degraded: ${JSON.stringify(body)}`);
        }
      }
    });
  }
  
  // Main authentication flow
  group('Authentication Cycle', () => {
    // Sign in or reuse token
    if (!vuTokens[vuId] || iterationCount[vuId] % 20 === 0) {
      const authStart = Date.now();
      
      const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
        email: user.email,
        password: user.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'soak-sign-in' },
      });
      
      authDuration.add(Date.now() - authStart);
      
      const success = check(signInRes, {
        'sign-in OK': (r) => r.status === 200,
        'has tokens': (r) => r.json('tokens.accessToken') !== null,
      });
      
      successRate.add(success);
      
      if (success) {
        vuTokens[vuId] = signInRes.json('tokens.accessToken');
      } else {
        errorCount.add(1);
        
        // Log failures for analysis
        if (signInRes.status !== 429) {  // Don't log rate limits
          console.log(`[${new Date().toISOString()}] Sign-in failed: ${signInRes.status}`);
        }
      }
    }
  });
  
  // Authenticated operations
  if (vuTokens[vuId]) {
    const headers = {
      'Authorization': `Bearer ${vuTokens[vuId]}`,
      'Content-Type': 'application/json',
    };
    
    group('Authenticated Operations', () => {
      // Get user profile
      const reqStart = Date.now();
      
      const meRes = http.get(`${API_URL}/users/me`, {
        headers,
        tags: { name: 'soak-get-me' },
      });
      
      requestDuration.add(Date.now() - reqStart);
      
      const success = check(meRes, {
        'profile loaded': (r) => r.status === 200,
      });
      
      successRate.add(success);
      
      if (!success) {
        errorCount.add(1);
        
        // Token expired?
        if (meRes.status === 401) {
          vuTokens[vuId] = null;
        }
      }
    });
    
    // Occasionally update profile
    if (Math.random() < 0.05) {
      group('Profile Update', () => {
        const updateRes = http.patch(`${API_URL}/users/me`, JSON.stringify({
          firstName: `Soak-${randomString(5)}`,
        }), {
          headers,
          tags: { name: 'soak-update' },
        });
        
        check(updateRes, {
          'update OK': (r) => r.status === 200,
        });
      });
    }
    
    // Occasionally sign out
    if (Math.random() < 0.05) {
      group('Sign Out', () => {
        const signOutRes = http.post(`${API_URL}/auth/sign-out`, JSON.stringify({}), {
          headers,
          tags: { name: 'soak-sign-out' },
        });
        
        check(signOutRes, {
          'sign-out OK': (r) => r.status === 200,
        });
        
        vuTokens[vuId] = null;
      });
    }
  }
  
  // Steady pace for soak
  sleep(2 + Math.random() * 3);  // 2-5 second sleep
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;
  console.log(`Soak test completed after ${duration.toFixed(1)} minutes.`);
  console.log(`Memory warnings: ${memoryWarnings}`);
  console.log(`Total errors: ${errorCount}`);
}

