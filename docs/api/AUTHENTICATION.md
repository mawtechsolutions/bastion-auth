# BastionAuth API Documentation - Authentication

## Overview

BastionAuth provides a comprehensive REST API for authentication operations. All endpoints are prefixed with `/api/v1`.

## Base URL

- Development: `http://localhost:3001/api/v1`
- Production: `https://api.bastionauth.dev/api/v1`

## Authentication

Most endpoints require authentication via Bearer token:

```http
Authorization: Bearer <access_token>
```

---

## Endpoints

### Sign Up

Create a new user account.

```http
POST /auth/sign-up
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | Password (min 8 chars, must include uppercase, lowercase, number, special char) |
| `firstName` | string | No | User's first name |
| `lastName` | string | No | User's last name |
| `username` | string | No | Unique username |

**Request Example:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresAt": "2024-01-15T10:45:00Z"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid input (weak password, invalid email format) |
| 409 | Email already exists |
| 429 | Rate limited |

---

### Sign In

Authenticate an existing user.

```http
POST /auth/sign-in
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

**Request Example:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK) - No MFA:**

```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresAt": "2024-01-15T10:45:00Z"
  }
}
```

**Response (200 OK) - MFA Required:**

```json
{
  "requiresMfa": true,
  "mfaChallengeId": "mfa_challenge_abc123",
  "availableMethods": ["totp", "backup_code"]
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid credentials |
| 423 | Account locked (too many failed attempts) |
| 429 | Rate limited |

---

### Verify MFA

Complete MFA challenge.

```http
POST /auth/mfa/verify
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mfaChallengeId` | string | Yes | Challenge ID from sign-in response |
| `code` | string | Yes | TOTP code or backup code |
| `method` | string | Yes | `totp` or `backup_code` |

**Request Example:**

```json
{
  "mfaChallengeId": "mfa_challenge_abc123",
  "code": "123456",
  "method": "totp"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresAt": "2024-01-15T10:45:00Z"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid or expired code |
| 400 | Challenge expired |

---

### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
```

**Request:**

The refresh token is sent via HTTP-only cookie.

**Response (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "expiresAt": "2024-01-15T10:45:00Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid or expired refresh token |

---

### Sign Out

Invalidate current session.

```http
POST /auth/sign-out
```

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### Sign Out All Sessions

Invalidate all user sessions.

```http
POST /auth/sign-out-all
```

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "sessionsRevoked": 5
}
```

---

### Forgot Password

Request password reset email.

```http
POST /auth/password/forgot
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

> **Note:** This endpoint always returns success to prevent email enumeration.

---

### Reset Password

Reset password using token from email.

```http
POST /auth/password/reset
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Reset token from email link |
| `password` | string | Yes | New password |

**Request Example:**

```json
{
  "token": "reset_token_abc123",
  "password": "NewSecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password has been reset successfully."
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid or expired token |
| 400 | Weak password |

---

### Verify Email

Verify user's email address.

```http
POST /auth/email/verify
```

**Request Body:**

```json
{
  "token": "verification_token_abc123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

---

### Resend Verification Email

Request a new verification email.

```http
POST /auth/email/resend
```

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Verification email sent."
}
```

---

### Request Magic Link

Send passwordless login link.

```http
POST /auth/magic-link
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If an account exists, a magic link has been sent."
}
```

---

### OAuth Initiation

Start OAuth flow with provider.

```http
GET /auth/oauth/:provider
```

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `provider` | OAuth provider: `google`, `github`, `microsoft`, `apple`, `linkedin` |

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `redirect_uri` | Yes | URL to redirect after OAuth |

**Response:**

Redirects to OAuth provider's authorization page.

---

### OAuth Callback

Handle OAuth callback (internal use).

```http
GET /auth/oauth/:provider/callback
```

This endpoint handles the OAuth callback and redirects to the frontend with tokens.

---

## MFA Management

### Enable MFA

Generate TOTP secret and QR code.

```http
POST /auth/mfa/enable
```

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

### Confirm MFA Setup

Confirm MFA with first TOTP code.

```http
POST /auth/mfa/confirm
```

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "backupCodes": [
    "ABCD1234",
    "EFGH5678",
    "..."
  ]
}
```

### Disable MFA

Disable MFA for account.

```http
POST /auth/mfa/disable
```

**Request Body:**

```json
{
  "password": "currentPassword123!"
}
```

**Response (200 OK):**

```json
{
  "success": true
}
```

### Regenerate Backup Codes

Generate new backup codes (invalidates old ones).

```http
POST /auth/mfa/backup-codes/regenerate
```

**Request Body:**

```json
{
  "password": "currentPassword123!"
}
```

**Response (200 OK):**

```json
{
  "backupCodes": [
    "ABCD1234",
    "EFGH5678",
    "..."
  ]
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The email or password is incorrect.",
    "statusCode": 401
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCOUNT_LOCKED` | 423 | Too many failed attempts |
| `TOKEN_EXPIRED` | 401 | Access/refresh token expired |
| `TOKEN_INVALID` | 401 | Token is invalid |
| `MFA_REQUIRED` | 401 | MFA verification needed |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Insufficient permissions |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/sign-in | 5 | 60s |
| POST /auth/sign-up | 3 | 60s |
| POST /auth/password/forgot | 3 | 60s |
| POST /auth/mfa/verify | 5 | 60s |
| Other endpoints | 100 | 60s |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1642243200
```

---

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **Token Security:**
   - Access tokens expire in 15 minutes
   - Refresh tokens expire in 7 days
   - Tokens are signed with RS256

3. **Cookies:**
   - `HttpOnly` flag set
   - `Secure` flag in production
   - `SameSite=Strict` in production

4. **No Account Enumeration:**
   - Sign-in returns same error for wrong password and non-existent email
   - Password reset always returns success

