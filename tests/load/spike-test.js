/**
 * BastionAuth - Spike Test
 * 
 * This script tests how the system handles sudden spikes in traffic.
 * Useful for testing auto-scaling and circuit breaker behavior.
 * 
 * Usage:
 *   k6 run tests/load/spike-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Custom metrics
const responseTime = new Trend('response_time', true);
const errorCount = new Counter('errors');
const successRate = new Rate('success_rate');

// Spike test options - sudden increase and decrease
export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '30s', target: 500 },  // Spike to 500 users!
    { duration: '1m', target: 500 },   // Hold at spike
    { duration: '30s', target: 10 },   // Drop back to normal
    { duration: '2m', target: 10 },    // Recovery period
    { duration: '30s', target: 0 },    // Ramp down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<5000'],   // 95% < 5s during spike
    http_req_failed: ['rate<0.30'],      // Allow higher error rate during spike
    success_rate: ['rate>0.70'],         // 70% success minimum during spike
  },
  
  tags: {
    testType: 'spike',
    service: 'bastionauth',
  },
};

export default function() {
  group('Spike Traffic', () => {
    // Health check
    const healthRes = http.get(`${BASE_URL}/health`);
    const healthOk = check(healthRes, {
      'health check passes': (r) => r.status === 200 || r.status === 503,
    });
    
    if (!healthOk) {
      console.log(`Health check failed: ${healthRes.status}`);
    }
    
    // Sign-in attempt
    const startTime = Date.now();
    
    const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
      email: 'spiketest@example.com',
      password: 'SpikeTest123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'spike-sign-in' },
      timeout: '10s',
    });
    
    responseTime.add(Date.now() - startTime);
    
    const success = check(signInRes, {
      'request completed': (r) => r.status !== 0,
      'not server error': (r) => r.status < 500 || r.status === 503,
      'response time < 10s': (r) => r.timings.duration < 10000,
    });
    
    successRate.add(success);
    
    if (signInRes.status >= 500 && signInRes.status !== 503) {
      errorCount.add(1);
      console.log(`Server error: ${signInRes.status}`);
    }
  });
  
  // Very short sleep during spike
  sleep(0.1 + Math.random() * 0.2);
}

export function setup() {
  console.log('Starting spike test...');
  console.log('Warning: This test will generate very high load!');
  
  // Verify service is up before spiking
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error('Service is not healthy, aborting spike test');
  }
  
  // Create test user
  http.post(`${API_URL}/auth/sign-up`, JSON.stringify({
    email: 'spiketest@example.com',
    password: 'SpikeTest123!',
    firstName: 'Spike',
    lastName: 'Test',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function teardown() {
  console.log('Spike test completed.');
}


