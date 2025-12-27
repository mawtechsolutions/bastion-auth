# BastionAuth - Load Testing Guide

This guide explains how to run load tests against BastionAuth using [k6](https://k6.io/).

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
winget install k6

# Docker
docker pull grafana/k6
```

### Start BastionAuth

```bash
# Start all services
docker-compose up -d

# Or run locally
pnpm dev
```

## Available Load Tests

| Test | File | Description | Duration |
|------|------|-------------|----------|
| **Auth Load** | `auth-load.js` | Standard authentication flow | ~16 min |
| **Stress Test** | `stress-test.js` | Find breaking point | ~33 min |
| **Spike Test** | `spike-test.js` | Handle traffic spikes | ~6 min |
| **MFA Load** | `mfa-load.js` | MFA authentication flow | ~16 min |
| **Token Refresh** | `token-refresh-load.js` | Token management | ~20 min |
| **Admin Load** | `admin-load.js` | Admin dashboard APIs | ~10 min |
| **Concurrent Sessions** | `concurrent-sessions.js` | Multi-device scenario | ~10 min |
| **Soak Test** | `soak-test.js` | Extended stability | ~1 hour |

## Running Tests

### Basic Usage

```bash
# Run a specific test
k6 run tests/load/auth-load.js

# Run with custom VUs and duration
k6 run --vus 50 --duration 5m tests/load/auth-load.js

# Run against a different environment
k6 run -e API_URL=https://staging.bastionauth.dev tests/load/auth-load.js
```

### With Docker

```bash
docker run --rm -i \
  --add-host=host.docker.internal:host-gateway \
  -v $(pwd):/scripts \
  grafana/k6 run /scripts/tests/load/auth-load.js
```

### Output Options

```bash
# JSON output for CI/CD
k6 run --out json=results.json tests/load/auth-load.js

# CSV output
k6 run --out csv=results.csv tests/load/auth-load.js

# Cloud output (k6 Cloud)
k6 cloud tests/load/auth-load.js

# InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 tests/load/auth-load.js
```

## Test Scenarios

### 1. Authentication Load Test

Tests the core auth flow: sign-up, sign-in, token refresh, sign-out.

```bash
k6 run tests/load/auth-load.js
```

**Thresholds:**
- 95th percentile response time < 500ms
- 99th percentile response time < 1s
- Error rate < 1%
- Sign-in 95th percentile < 600ms

### 2. Stress Test

Gradually increases load to find the breaking point.

```bash
k6 run tests/load/stress-test.js
```

**Stages:**
- Ramp to 50 users
- Ramp to 100 users
- Ramp to 200 users
- Ramp to 300 users

**Thresholds:**
- 95th percentile < 2s under stress
- Error rate < 10%
- 80% success rate minimum

### 3. Spike Test

Tests sudden traffic spikes (e.g., marketing campaign launch).

```bash
k6 run tests/load/spike-test.js
```

**Scenario:**
- Normal load: 10 users
- Spike to 500 users in 30 seconds
- Hold spike for 1 minute
- Drop back to normal
- Recovery period

### 4. MFA Load Test

Tests MFA authentication flow under load.

```bash
k6 run tests/load/mfa-load.js
```

**Prerequisites:** 
- MFA-enabled test users in database

**Thresholds:**
- MFA challenge < 800ms (95th)
- MFA verify < 500ms (95th)
- 90% success rate

### 5. Token Refresh Load

Tests token lifecycle and refresh mechanisms.

```bash
k6 run tests/load/token-refresh-load.js
```

**Tests:**
- Initial token acquisition
- Token refresh before expiry
- Concurrent token operations
- Token invalidation

### 6. Admin Dashboard Load

Tests admin API endpoints under load.

```bash
k6 run tests/load/admin-load.js
```

**Environment:**
```bash
k6 run \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=AdminPass123! \
  tests/load/admin-load.js
```

### 7. Concurrent Sessions

Tests multi-device scenario with same user.

```bash
k6 run tests/load/concurrent-sessions.js
```

### 8. Soak Test

Long-running stability test to detect memory leaks.

```bash
# Default 1-hour soak
k6 run tests/load/soak-test.js

# Extended 4-hour soak
k6 run --duration 4h tests/load/soak-test.js
```

## Performance Thresholds

### Response Time Targets

| Endpoint | Target (p95) | Target (p99) |
|----------|--------------|--------------|
| Health Check | 100ms | 200ms |
| Sign In | 500ms | 1000ms |
| Sign Up | 800ms | 1500ms |
| Token Refresh | 200ms | 400ms |
| User Profile | 300ms | 500ms |
| Admin Stats | 500ms | 1000ms |
| Admin User List | 1000ms | 2000ms |
| Audit Logs | 1500ms | 3000ms |

### Error Rate Targets

| Test Type | Max Error Rate |
|-----------|----------------|
| Load Test | 1% |
| Stress Test | 10% |
| Spike Test | 30% |
| Soak Test | 1% |

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  schedule:
    - cron: '0 4 * * 1'  # Weekly Monday at 4 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Start API
        run: |
          pnpm --filter @bastionauth/server dev &
          sleep 10
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bastionauth
          REDIS_URL: redis://localhost:6379
      
      - name: Install k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
          sudo mv k6 /usr/local/bin/
      
      - name: Run Load Test
        run: k6 run --out json=results.json tests/load/auth-load.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: results.json
```

### Grafana Dashboard

For real-time monitoring, set up Grafana with InfluxDB:

```bash
# Start monitoring stack
docker-compose -f docker/monitoring/docker-compose.monitoring.yml up -d

# Run test with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 tests/load/auth-load.js
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```
error="Get \"http://localhost:3001/health\": dial tcp 127.0.0.1:3001: connect: connection refused"
```
Solution: Ensure the API server is running and accessible.

**2. Rate Limiting**
```
status=429 Too Many Requests
```
Solution: This is expected behavior. Adjust request rate or configure higher limits for testing.

**3. Token Expired**
```
status=401 Unauthorized
```
Solution: The test should handle token refresh. Check token refresh logic.

**4. Memory Issues (Docker)**
```
FATAL: memory alloc error
```
Solution: Increase Docker memory limits or reduce VU count.

### Performance Tuning

For optimal load testing:

1. **Run from dedicated machine** - Don't run k6 on same machine as API
2. **Use sufficient resources** - k6 needs CPU for high VU counts
3. **Monitor API resources** - Track CPU, memory, DB connections
4. **Warm up the system** - Run a short warm-up before main test

## Interpreting Results

### Key Metrics

```
http_req_duration.............: avg=234.56ms min=45ms med=189ms max=2.3s p(90)=456ms p(95)=567ms
http_req_failed...............: 0.45% ✓ 45 ✗ 9955
http_reqs.....................: 10000 166.67/s
```

- **avg**: Average response time
- **med**: Median (50th percentile)
- **p(90)**, **p(95)**: Percentile response times
- **http_req_failed**: Failure rate
- **http_reqs**: Total requests and rate

### Success Criteria

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| p95 Response | < 500ms | < 1s | > 1s |
| Error Rate | < 0.1% | < 1% | > 1% |
| Throughput | > 100 rps | > 50 rps | < 50 rps |

## Next Steps

1. **Baseline Testing** - Run `auth-load.js` to establish baseline
2. **Stress Testing** - Run `stress-test.js` to find limits
3. **Spike Testing** - Run `spike-test.js` to test resilience
4. **Soak Testing** - Run `soak-test.js` before production release
5. **Continuous Testing** - Integrate into CI/CD pipeline

