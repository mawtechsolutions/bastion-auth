#!/bin/bash

# =============================================================================
# BastionAuth - OWASP ZAP Security Scan Script
# =============================================================================
# This script runs OWASP ZAP security scans against the BastionAuth API.
#
# Prerequisites:
#   - Docker installed and running
#   - BastionAuth API running on localhost:3001
#
# Usage:
#   ./scripts/security-scan.sh [options]
#
# Options:
#   --quick       Run quick scan (spider only, ~5 min)
#   --full        Run full scan (spider + active scan, ~30 min)
#   --api-only    Scan API endpoints only
#   --all         Scan API and admin dashboard
#   --output DIR  Output directory for reports (default: ./security-reports)
# =============================================================================

set -e

# Configuration
API_URL="${API_URL:-http://host.docker.internal:3001}"
ADMIN_URL="${ADMIN_URL:-http://host.docker.internal:3002}"
ZAP_IMAGE="ghcr.io/zaproxy/zaproxy:stable"
OUTPUT_DIR="${OUTPUT_DIR:-./security-reports}"
SCAN_TYPE="quick"
SCAN_TARGET="api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      SCAN_TYPE="quick"
      shift
      ;;
    --full)
      SCAN_TYPE="full"
      shift
      ;;
    --api-only)
      SCAN_TARGET="api"
      shift
      ;;
    --all)
      SCAN_TARGET="all"
      shift
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BastionAuth Security Scan${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Scan Type: ${YELLOW}$SCAN_TYPE${NC}"
echo -e "Target: ${YELLOW}$SCAN_TARGET${NC}"
echo -e "API URL: ${YELLOW}$API_URL${NC}"
echo -e "Output: ${YELLOW}$OUTPUT_DIR${NC}"
echo ""

# Check if API is reachable
echo -e "${BLUE}Checking API health...${NC}"
if ! curl -s --fail "http://localhost:3001/health" > /dev/null 2>&1; then
  echo -e "${RED}Error: API is not reachable at http://localhost:3001${NC}"
  echo "Please start the API server first."
  exit 1
fi
echo -e "${GREEN}API is healthy!${NC}"
echo ""

# Create ZAP context file for authentication
create_context_file() {
  cat > "$OUTPUT_DIR/zap-context.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <context>
    <name>BastionAuth</name>
    <desc>BastionAuth API Security Context</desc>
    <inscope>true</inscope>
    <incregexes>http://host.docker.internal:3001/.*</incregexes>
    <excregexes>.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)(\?.*)?$</excregexes>
    <tech>
      <include>Db.PostgreSQL</include>
      <include>Language.JavaScript</include>
      <include>OS.Linux</include>
      <include>SCM.Git</include>
      <include>WS.Node.js</include>
    </tech>
    <authentication>
      <type>json</type>
      <loginurl>http://host.docker.internal:3001/api/v1/auth/sign-in</loginurl>
      <loginrequestdata>{"email":"{%username%}","password":"{%password%}"}</loginrequestdata>
    </authentication>
    <users>
      <user>test@example.com:Test123!</user>
    </users>
  </context>
</configuration>
EOF
}

# Create API scan configuration
create_api_scan_config() {
  cat > "$OUTPUT_DIR/zap-api-scan.conf" << 'EOF'
# ZAP API Scan Configuration for BastionAuth

# Enable/disable specific rule categories
rules.domains.only.http=localhost,host.docker.internal
ajax.spider.enabled=false

# Authentication
authentication.method=json
authentication.url=http://host.docker.internal:3001/api/v1/auth/sign-in
authentication.credentials={"email":"test@example.com","password":"Test123!"}
authentication.headerName=Authorization
authentication.headerValuePrefix=Bearer

# Rate limiting - be gentle on auth endpoints
connection.delayInMs=100

# Specific endpoint configurations
endpoint.exclude=/health,/metrics,/health/live,/health/ready

# Alert thresholds
alert.threshold.high=1
alert.threshold.medium=5
alert.threshold.low=10
alert.threshold.info=20
EOF
}

# Run ZAP baseline scan (quick)
run_quick_scan() {
  local target_url="$1"
  local report_name="$2"
  
  echo -e "${BLUE}Running quick baseline scan on $target_url...${NC}"
  
  docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -v "$PWD/$OUTPUT_DIR:/zap/wrk:rw" \
    "$ZAP_IMAGE" \
    zap-baseline.py \
    -t "$target_url" \
    -r "${report_name}_baseline.html" \
    -J "${report_name}_baseline.json" \
    -w "${report_name}_baseline.md" \
    -c zap-api-scan.conf \
    --auto \
    -I \
    || true

  echo -e "${GREEN}Quick scan complete! Reports saved to $OUTPUT_DIR${NC}"
}

# Run ZAP full scan (comprehensive)
run_full_scan() {
  local target_url="$1"
  local report_name="$2"
  
  echo -e "${BLUE}Running full active scan on $target_url...${NC}"
  echo -e "${YELLOW}This may take 20-30 minutes...${NC}"
  
  docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -v "$PWD/$OUTPUT_DIR:/zap/wrk:rw" \
    "$ZAP_IMAGE" \
    zap-full-scan.py \
    -t "$target_url" \
    -r "${report_name}_full.html" \
    -J "${report_name}_full.json" \
    -w "${report_name}_full.md" \
    -c zap-api-scan.conf \
    --auto \
    -I \
    || true

  echo -e "${GREEN}Full scan complete! Reports saved to $OUTPUT_DIR${NC}"
}

# Run ZAP API scan
run_api_scan() {
  local openapi_url="$1"
  local report_name="$2"
  
  echo -e "${BLUE}Running API scan with OpenAPI spec...${NC}"
  
  # First, try to get OpenAPI spec
  if curl -s --fail "http://localhost:3001/api/v1/docs/json" > "$OUTPUT_DIR/openapi.json" 2>/dev/null; then
    echo -e "${GREEN}OpenAPI spec downloaded${NC}"
    
    docker run --rm \
      --add-host=host.docker.internal:host-gateway \
      -v "$PWD/$OUTPUT_DIR:/zap/wrk:rw" \
      "$ZAP_IMAGE" \
      zap-api-scan.py \
      -t "http://host.docker.internal:3001/api/v1" \
      -f openapi \
      -r "${report_name}_api.html" \
      -J "${report_name}_api.json" \
      -w "${report_name}_api.md" \
      --auto \
      -I \
      || true
  else
    echo -e "${YELLOW}OpenAPI spec not available, running baseline scan instead${NC}"
    run_quick_scan "$API_URL" "$report_name"
  fi

  echo -e "${GREEN}API scan complete!${NC}"
}

# Generate summary report
generate_summary() {
  echo -e "${BLUE}Generating summary report...${NC}"
  
  cat > "$OUTPUT_DIR/SECURITY_SCAN_SUMMARY_${TIMESTAMP}.md" << EOF
# BastionAuth Security Scan Summary

**Date:** $(date)
**Scan Type:** $SCAN_TYPE
**Target:** $SCAN_TARGET

## Scan Results

### Files Generated
$(ls -la "$OUTPUT_DIR" | grep -E "\.html|\.json|\.md" | awk '{print "- " $NF}')

## Interpreting Results

### Alert Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| **High** | Critical vulnerabilities that can lead to system compromise | Immediate fix required |
| **Medium** | Significant vulnerabilities that should be addressed | Fix before production |
| **Low** | Minor vulnerabilities with limited impact | Consider fixing |
| **Info** | Informational findings | Review and document |

### Common Findings and Remediation

1. **Missing Security Headers**
   - Add X-Content-Type-Options: nosniff
   - Add X-Frame-Options: DENY
   - Add Content-Security-Policy
   - Configure Strict-Transport-Security for HTTPS

2. **CORS Issues**
   - Ensure Access-Control-Allow-Origin is restrictive
   - Don't use wildcard (*) in production

3. **Cookie Security**
   - Set Secure flag on all cookies
   - Set HttpOnly flag on session cookies
   - Use SameSite=Strict or SameSite=Lax

4. **Information Disclosure**
   - Remove server version headers
   - Customize error messages
   - Don't expose stack traces

## Next Steps

1. Review HTML report for detailed findings
2. Prioritize High and Medium severity issues
3. Create tickets for remediation
4. Re-run scan after fixes
5. Schedule regular scans (weekly/monthly)

## Running Scans Locally

\`\`\`bash
# Quick scan
./scripts/security-scan.sh --quick

# Full scan
./scripts/security-scan.sh --full

# Scan everything
./scripts/security-scan.sh --full --all
\`\`\`

EOF

  echo -e "${GREEN}Summary report generated: $OUTPUT_DIR/SECURITY_SCAN_SUMMARY_${TIMESTAMP}.md${NC}"
}

# Main execution
main() {
  echo -e "${BLUE}Setting up scan environment...${NC}"
  create_context_file
  create_api_scan_config
  
  if [[ "$SCAN_TARGET" == "api" || "$SCAN_TARGET" == "all" ]]; then
    local report_prefix="api_scan_${TIMESTAMP}"
    
    if [[ "$SCAN_TYPE" == "quick" ]]; then
      run_quick_scan "$API_URL" "$report_prefix"
    else
      run_full_scan "$API_URL" "$report_prefix"
    fi
  fi
  
  if [[ "$SCAN_TARGET" == "all" ]]; then
    echo ""
    echo -e "${BLUE}Scanning Admin Dashboard...${NC}"
    local admin_report_prefix="admin_scan_${TIMESTAMP}"
    
    if [[ "$SCAN_TYPE" == "quick" ]]; then
      run_quick_scan "$ADMIN_URL" "$admin_report_prefix"
    else
      run_quick_scan "$ADMIN_URL" "$admin_report_prefix"
    fi
  fi
  
  generate_summary
  
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Security scan complete!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo -e "Reports available in: ${YELLOW}$OUTPUT_DIR${NC}"
  echo ""
  echo -e "To view the HTML report:"
  echo -e "  ${BLUE}open $OUTPUT_DIR/*.html${NC}"
  echo ""
}

# Run main function
main

