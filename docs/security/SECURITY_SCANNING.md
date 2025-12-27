# BastionAuth - Security Scanning Guide

This document describes how to run security scans against BastionAuth using OWASP ZAP (Zed Attack Proxy).

## Prerequisites

1. **Docker** - OWASP ZAP runs in a container
2. **Running BastionAuth** - API server should be running on `localhost:3001`
3. **Test Data** - Seed database with test users

## Quick Start

### Run a Quick Baseline Scan

```bash
# Start the API server
pnpm --filter @bastionauth/server dev

# In another terminal, run the security scan
./scripts/security-scan.sh --quick
```

### Run a Full Security Scan

```bash
./scripts/security-scan.sh --full
```

### Scan Everything (API + Admin Dashboard)

```bash
./scripts/security-scan.sh --full --all
```

## Scan Types

### Baseline Scan (Quick)
- **Duration:** ~5 minutes
- **Coverage:** Spider crawl, passive scanning
- **Use Case:** CI/CD pipeline, quick checks

The baseline scan:
1. Crawls the API using a spider
2. Runs passive security checks
3. Identifies common vulnerabilities without attacking

### Full Scan (Comprehensive)
- **Duration:** ~30 minutes
- **Coverage:** Spider + Active scanning
- **Use Case:** Pre-release security audit

The full scan:
1. Crawls the API thoroughly
2. Runs passive security checks
3. Performs active vulnerability testing (SQL injection, XSS, etc.)

## Manual ZAP Usage

### Running ZAP with GUI

```bash
docker run --rm \
  -p 8080:8080 \
  -p 8090:8090 \
  --add-host=host.docker.internal:host-gateway \
  -v $(pwd)/security-reports:/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-webswing.sh
```

Access ZAP at: http://localhost:8080/zap/

### Running ZAP Headless with API

```bash
# Start ZAP daemon
docker run --rm -d \
  --name zap \
  -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -daemon \
  -host 0.0.0.0 \
  -port 8080 \
  -config api.disablekey=true

# Run scan via API
curl "http://localhost:8080/JSON/spider/action/scan/?url=http://host.docker.internal:3001"
```

## Configuration

### Authentication Setup

For authenticated scanning, configure ZAP to use BastionAuth credentials:

```python
# ZAP Python script for authenticated scanning
import requests

ZAP_BASE = "http://localhost:8080"
TARGET = "http://host.docker.internal:3001"

# Configure authentication
requests.get(f"{ZAP_BASE}/JSON/authentication/action/setAuthenticationMethod/", params={
    "contextId": 1,
    "authMethodName": "jsonBasedAuthentication",
    "authMethodConfigParams": f"loginUrl={TARGET}/api/v1/auth/sign-in&loginRequestData={{\"email\":\"{{%username%}}\",\"password\":\"{{%password%}}\"}}"
})

# Add test user
requests.get(f"{ZAP_BASE}/JSON/users/action/newUser/", params={
    "contextId": 1,
    "name": "testuser"
})

requests.get(f"{ZAP_BASE}/JSON/users/action/setAuthenticationCredentials/", params={
    "contextId": 1,
    "userId": 0,
    "authCredentialsConfigParams": "username=test@example.com&password=Test123!"
})
```

### Scan Configuration File

Create `zap-config.yaml`:

```yaml
env:
  contexts:
    - name: "BastionAuth"
      urls:
        - "http://localhost:3001"
      includePaths:
        - "http://localhost:3001/api/.*"
      excludePaths:
        - ".*\\.js$"
        - ".*\\.css$"
      authentication:
        method: "json"
        parameters:
          loginPageUrl: "http://localhost:3001/api/v1/auth/sign-in"
          loginRequestUrl: "http://localhost:3001/api/v1/auth/sign-in"
          loginRequestBody: '{"email":"{%username%}","password":"{%password%}"}'
      users:
        - name: "test-user"
          credentials:
            username: "test@example.com"
            password: "Test123!"

jobs:
  - type: spider
    parameters:
      maxDuration: 5
  - type: passiveScan-wait
  - type: activeScan
    parameters:
      maxScanDurationInMins: 30
  - type: report
    parameters:
      template: "traditional-html"
      reportDir: "/zap/wrk"
```

Run with config:

```bash
docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v $(pwd):/zap/wrk \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -cmd -autorun /zap/wrk/zap-config.yaml
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM
  workflow_dispatch:

jobs:
  zap-scan:
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

      - name: Setup database
        run: pnpm --filter @bastionauth/server db:push
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bastionauth

      - name: Start API server
        run: |
          pnpm --filter @bastionauth/server dev &
          sleep 10
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bastionauth
          REDIS_URL: redis://localhost:6379

      - name: Run ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:3001'
          rules_file_name: '.zap-rules.tsv'
          cmd_options: '-a'

      - name: Upload Security Report
        uses: actions/upload-artifact@v4
        with:
          name: zap-report
          path: |
            report_html.html
            report_json.json
```

### GitLab CI

```yaml
# .gitlab-ci.yml
security-scan:
  stage: test
  image: ghcr.io/zaproxy/zaproxy:stable
  services:
    - postgres:15
    - redis:7
  variables:
    DATABASE_URL: postgresql://postgres:postgres@postgres/bastionauth
    REDIS_URL: redis://redis:6379
  before_script:
    - apt-get update && apt-get install -y curl
  script:
    - zap-baseline.py -t http://api:3001 -r zap-report.html -J zap-report.json
  artifacts:
    paths:
      - zap-report.html
      - zap-report.json
    when: always
```

## Interpreting Results

### Severity Levels

| Level | Risk | Action |
|-------|------|--------|
| **High** | Critical security issues | Block release, fix immediately |
| **Medium** | Significant vulnerabilities | Fix before production |
| **Low** | Minor issues | Track and fix in backlog |
| **Informational** | Best practice suggestions | Review and consider |

### Common Findings

#### 1. Missing Security Headers
**Finding:** X-Content-Type-Options, X-Frame-Options, CSP missing

**Fix:** Already implemented in Fastify server with Helmet. Verify headers:
```bash
curl -I http://localhost:3001/health
```

#### 2. Cookie Security Issues
**Finding:** Missing Secure/HttpOnly/SameSite

**Fix:** Cookies are set correctly in auth routes:
```typescript
reply.setCookie('refresh_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/'
});
```

#### 3. Information Disclosure
**Finding:** Server version exposed, stack traces in errors

**Fix:** 
- Remove `X-Powered-By` header (done with Helmet)
- Customize error responses
- Don't expose stack traces in production

#### 4. CORS Misconfiguration
**Finding:** Overly permissive CORS

**Fix:** Ensure CORS is configured for specific origins:
```typescript
fastify.register(cors, {
  origin: ['https://your-app.com'],
  credentials: true
});
```

## Baseline Thresholds

Create `.zap-rules.tsv` to set pass/fail thresholds:

```tsv
# Rule ID	Alert Name	Action	Threshold
10021	X-Content-Type-Options Header Missing	FAIL	High
10038	Content Security Policy (CSP) Header Not Set	WARN	Medium
40012	Cross Site Scripting (Reflected)	FAIL	High
40014	Cross Site Scripting (Persistent)	FAIL	High
90033	Loosely Scoped Cookie	WARN	Low
```

## Recommended Scan Schedule

| Environment | Scan Type | Frequency |
|-------------|-----------|-----------|
| Development | Baseline | Per PR/commit |
| Staging | Full | Weekly |
| Production | Baseline | Daily (read-only) |
| Pre-Release | Full + Manual | Before each release |

## Additional Resources

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [BastionAuth Security Checklist](./PENTEST_CHECKLIST.md)

