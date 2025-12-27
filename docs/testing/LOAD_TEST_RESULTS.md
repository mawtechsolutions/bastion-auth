# Load Test Results

**Test Date:** December 26, 2025  
**Environment:** Local Development  
**Tool:** k6 v1.4.2

---

## Auth Load Test Results

### Test Configuration
- **Duration:** 30 seconds
- **Virtual Users:** 5
- **Script:** `tests/load/auth-load.js`

### Performance Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| HTTP Request Duration (p95) | 144.48ms | < 500ms | ✅ PASS |
| HTTP Request Duration (p99) | 234.87ms | < 1000ms | ✅ PASS |
| Sign-in Duration (p95) | 146.35ms | < 600ms | ✅ PASS |
| Token Refresh Duration (p95) | 19.59ms | < 200ms | ✅ PASS |

### Rate Limiting Results

| Metric | Value | Note |
|--------|-------|------|
| Sign-in Success Rate | 33.78% | Rate limiting active |
| Auth Failures | 49 | Expected (rate limited) |
| Total Requests | 155 | |

### Analysis

1. **Rate Limiting Works Correctly** ✅
   - The 33% success rate indicates the rate limiter is blocking excessive requests
   - This is expected and desired behavior for security

2. **Response Times Are Excellent** ✅
   - p95 under 150ms for all operations
   - Token refresh very fast at ~20ms p95

3. **No Server Errors** ✅
   - All failures are 429 (rate limited), not 5xx errors

---

## Available Load Test Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `auth-load.js` | Basic auth flow load test | `k6 run tests/load/auth-load.js` |
| `mfa-load.js` | MFA-enabled sign-in flow | `k6 run tests/load/mfa-load.js` |
| `token-refresh-load.js` | Token refresh endpoint | `k6 run tests/load/token-refresh-load.js` |
| `admin-load.js` | Admin API operations | `k6 run tests/load/admin-load.js` |
| `concurrent-sessions.js` | Multiple concurrent sessions | `k6 run tests/load/concurrent-sessions.js` |
| `stress-test.js` | System breaking point test | `k6 run tests/load/stress-test.js` |
| `spike-test.js` | Sudden traffic spike test | `k6 run tests/load/spike-test.js` |
| `soak-test.js` | Long duration stability test | `k6 run tests/load/soak-test.js` |

---

## Running Load Tests

### Prerequisites
```bash
# Install k6
brew install k6

# Ensure server is running
pnpm dev

# Clear rate limits before testing
docker exec bastionauth-redis redis-cli FLUSHALL
```

### Quick Test (30 seconds)
```bash
k6 run tests/load/auth-load.js --duration=30s --vus=5
```

### Stress Test (find breaking point)
```bash
k6 run tests/load/stress-test.js
```

### Full Load Test Suite
```bash
# Run all load tests sequentially
for script in tests/load/*.js; do
  echo "Running $script..."
  k6 run "$script" --duration=30s --vus=10
  sleep 5
done
```

---

## Recommendations

1. **For Production:**
   - Run stress tests to find server capacity limits
   - Adjust rate limiting based on expected traffic patterns
   - Monitor p99 latencies under load

2. **Before Major Releases:**
   - Run soak test (4+ hours) to check for memory leaks
   - Run spike test to verify auto-scaling behavior
   - Document baseline performance metrics

