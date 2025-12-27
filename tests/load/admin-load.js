/**
 * BastionAuth - Admin Dashboard Load Test
 * 
 * This script tests the admin API endpoints under load.
 * 
 * Usage:
 *   k6 run tests/load/admin-load.js
 *   k6 run --vus 10 --duration 5m tests/load/admin-load.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Admin credentials (should match seed data)
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || 'admin@bastionauth.dev';
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin123!';

// Custom metrics
const statsLoadDuration = new Trend('stats_load_duration', true);
const usersListDuration = new Trend('users_list_duration', true);
const sessionsListDuration = new Trend('sessions_list_duration', true);
const auditLogsDuration = new Trend('audit_logs_duration', true);
const adminErrors = new Counter('admin_errors');
const adminSuccess = new Rate('admin_success_rate');

// Test options
export const options = {
  scenarios: {
    admin_dashboard: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // Ramp up
        { duration: '3m', target: 10 },   // Hold at 10 admin users
        { duration: '2m', target: 20 },   // Increase
        { duration: '3m', target: 20 },   // Hold
        { duration: '1m', target: 0 },    // Ramp down
      ],
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    stats_load_duration: ['p(95)<1000'],
    users_list_duration: ['p(95)<1500'],
    sessions_list_duration: ['p(95)<1500'],
    audit_logs_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    admin_success_rate: ['rate>0.90'],
  },
  
  tags: {
    testType: 'admin-load',
    service: 'bastionauth',
  },
};

// Store admin token
let adminToken = null;

export function setup() {
  console.log('Setting up admin load test...');
  
  // Verify API health
  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) {
    throw new Error('API is not healthy');
  }
  
  // Sign in as admin
  const signInRes = http.post(`${API_URL}/auth/sign-in`, JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (signInRes.status !== 200) {
    console.log(`Admin sign-in failed: ${signInRes.status} - ${signInRes.body}`);
    throw new Error('Failed to sign in as admin');
  }
  
  const body = signInRes.json();
  adminToken = body.tokens?.accessToken;
  
  if (!adminToken) {
    throw new Error('No admin token received');
  }
  
  console.log('Admin authenticated successfully');
  
  return { adminToken };
}

export default function(data) {
  const token = data.adminToken;
  
  if (!token) {
    console.log('No admin token available');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Dashboard Statistics
  group('Dashboard Stats', () => {
    const startTime = Date.now();
    
    const statsRes = http.get(`${API_URL}/admin/stats`, {
      headers,
      tags: { name: 'admin-stats' },
    });
    
    statsLoadDuration.add(Date.now() - startTime);
    
    const success = check(statsRes, {
      'stats loaded': (r) => r.status === 200,
      'has totalUsers': (r) => r.json('totalUsers') !== undefined,
      'has activeSessions': (r) => r.json('activeSessions') !== undefined,
    });
    
    adminSuccess.add(success);
    if (!success) {
      adminErrors.add(1);
    }
  });
  
  sleep(0.5);
  
  // Users List
  group('Users List', () => {
    const startTime = Date.now();
    
    const usersRes = http.get(`${API_URL}/admin/users?page=1&limit=20`, {
      headers,
      tags: { name: 'admin-users' },
    });
    
    usersListDuration.add(Date.now() - startTime);
    
    const success = check(usersRes, {
      'users loaded': (r) => r.status === 200,
      'has data array': (r) => Array.isArray(r.json('data')),
    });
    
    adminSuccess.add(success);
    if (!success) {
      adminErrors.add(1);
    }
    
    // Sometimes fetch individual user
    if (Math.random() < 0.3 && usersRes.status === 200) {
      const users = usersRes.json('data');
      if (users && users.length > 0) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        const userDetailRes = http.get(`${API_URL}/admin/users/${randomUser.id}`, {
          headers,
          tags: { name: 'admin-user-detail' },
        });
        
        check(userDetailRes, {
          'user detail loaded': (r) => r.status === 200,
        });
      }
    }
  });
  
  sleep(0.5);
  
  // Sessions List
  group('Sessions List', () => {
    const startTime = Date.now();
    
    const sessionsRes = http.get(`${API_URL}/admin/sessions?page=1&limit=20`, {
      headers,
      tags: { name: 'admin-sessions' },
    });
    
    sessionsListDuration.add(Date.now() - startTime);
    
    const success = check(sessionsRes, {
      'sessions loaded': (r) => r.status === 200,
      'has data': (r) => r.json('data') !== undefined,
    });
    
    adminSuccess.add(success);
    if (!success) {
      adminErrors.add(1);
    }
  });
  
  sleep(0.5);
  
  // Audit Logs
  group('Audit Logs', () => {
    const startTime = Date.now();
    
    const logsRes = http.get(`${API_URL}/admin/audit-logs?page=1&limit=50`, {
      headers,
      tags: { name: 'admin-audit-logs' },
    });
    
    auditLogsDuration.add(Date.now() - startTime);
    
    const success = check(logsRes, {
      'audit logs loaded': (r) => r.status === 200,
      'has data': (r) => r.json('data') !== undefined,
    });
    
    adminSuccess.add(success);
    if (!success) {
      adminErrors.add(1);
    }
    
    // Filter by action
    if (Math.random() < 0.2) {
      const filterRes = http.get(`${API_URL}/admin/audit-logs?action=user.sign_in&limit=20`, {
        headers,
        tags: { name: 'admin-audit-filter' },
      });
      
      check(filterRes, {
        'filtered logs loaded': (r) => r.status === 200,
      });
    }
  });
  
  sleep(0.5);
  
  // API Keys (less frequently)
  if (Math.random() < 0.2) {
    group('API Keys', () => {
      const keysRes = http.get(`${API_URL}/admin/api-keys`, {
        headers,
        tags: { name: 'admin-api-keys' },
      });
      
      check(keysRes, {
        'api keys loaded': (r) => r.status === 200,
      });
    });
  }
  
  // Organizations (less frequently)
  if (Math.random() < 0.3) {
    group('Organizations', () => {
      const orgsRes = http.get(`${API_URL}/admin/organizations?page=1&limit=10`, {
        headers,
        tags: { name: 'admin-orgs' },
      });
      
      check(orgsRes, {
        'organizations loaded': (r) => r.status === 200,
      });
    });
  }
  
  // User search
  if (Math.random() < 0.3) {
    group('User Search', () => {
      const searchRes = http.get(`${API_URL}/admin/users?search=test&limit=10`, {
        headers,
        tags: { name: 'admin-user-search' },
      });
      
      check(searchRes, {
        'search completed': (r) => r.status === 200,
      });
    });
  }
  
  sleep(1 + Math.random() * 2);
}

export function teardown(data) {
  console.log('Admin load test completed.');
}

