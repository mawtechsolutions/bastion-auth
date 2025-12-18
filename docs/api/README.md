# BastionAuth API Reference

This is the complete API reference for BastionAuth.

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.yourdomain.com/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

Access tokens are obtained through the sign-in flow and are valid for 15 minutes.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Rate Limiting

Endpoints are rate-limited. Limits vary by endpoint:

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 5 req/min |
| API General | 100 req/min |
| Admin API | 50 req/min |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 60
```

---

## Authentication Endpoints

### Sign Up

Create a new user account.

```http
POST /auth/sign-up
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": false,
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "session": {
      "id": "ses_...",
      "expiresAt": "2024-01-22T10:00:00Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "rt_..."
  }
}
```

### Sign In

Authenticate with email and password.

```http
POST /auth/sign-in
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "rt_...",
    "requiresMfa": false
  }
}
```

**MFA Required Response**

```json
{
  "success": true,
  "data": {
    "requiresMfa": true,
    "mfaToken": "mfa_..."
  }
}
```

### Verify MFA

Complete sign-in with MFA code.

```http
POST /auth/mfa/verify
```

**Request Body**

```json
{
  "mfaToken": "mfa_...",
  "code": "123456"
}
```

### Sign Out

End the current session.

```http
POST /auth/sign-out
Authorization: Bearer <token>
```

### Refresh Token

Get a new access token.

```http
POST /auth/refresh
```

**Request Body**

```json
{
  "refreshToken": "rt_..."
}
```

### Request Password Reset

```http
POST /auth/password/reset/request
```

**Request Body**

```json
{
  "email": "user@example.com"
}
```

### Reset Password

```http
POST /auth/password/reset
```

**Request Body**

```json
{
  "token": "reset_token",
  "password": "NewSecurePassword123!"
}
```

### Request Magic Link

```http
POST /auth/magic-link
```

**Request Body**

```json
{
  "email": "user@example.com",
  "redirectUrl": "/dashboard"
}
```

### Verify Magic Link

```http
GET /auth/magic-link/verify?token=<token>
```

---

## OAuth Endpoints

### Start OAuth Flow

```http
GET /auth/oauth/:provider
```

**Providers**: `google`, `github`, `microsoft`, `apple`, `linkedin`

**Query Parameters**

| Parameter | Description |
|-----------|-------------|
| redirectUrl | URL to redirect after auth |
| state | Custom state parameter |

### OAuth Callback

```http
GET /auth/oauth/:provider/callback
```

---

## User Endpoints

### Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "usr_...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": null,
    "emailVerified": true,
    "mfaEnabled": false,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Update User

```http
PATCH /users/me
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "imageUrl": "https://..."
}
```

### Delete User

```http
DELETE /users/me
Authorization: Bearer <token>
```

### Get User Sessions

```http
GET /users/me/sessions
Authorization: Bearer <token>
```

### Revoke Session

```http
DELETE /users/me/sessions/:sessionId
Authorization: Bearer <token>
```

---

## MFA Endpoints

### Start TOTP Setup

```http
POST /users/me/mfa/totp/setup
Authorization: Bearer <token>
```

**Response**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,...",
    "backupCodes": ["CODE1234", "CODE5678", ...]
  }
}
```

### Verify TOTP Setup

```http
POST /users/me/mfa/totp/verify
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "code": "123456"
}
```

### Disable MFA

```http
DELETE /users/me/mfa
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "password": "YourPassword123!"
}
```

### Regenerate Backup Codes

```http
POST /users/me/mfa/backup-codes
Authorization: Bearer <token>
```

---

## Organization Endpoints

### List Organizations

```http
GET /organizations
Authorization: Bearer <token>
```

### Create Organization

```http
POST /organizations
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "name": "Acme Corp",
  "slug": "acme-corp"
}
```

### Get Organization

```http
GET /organizations/:orgId
Authorization: Bearer <token>
```

### Update Organization

```http
PATCH /organizations/:orgId
Authorization: Bearer <token>
```

### Delete Organization

```http
DELETE /organizations/:orgId
Authorization: Bearer <token>
```

### List Members

```http
GET /organizations/:orgId/members
Authorization: Bearer <token>
```

### Invite Member

```http
POST /organizations/:orgId/invitations
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "email": "invite@example.com",
  "role": "member"
}
```

### Remove Member

```http
DELETE /organizations/:orgId/members/:userId
Authorization: Bearer <token>
```

### Update Member Role

```http
PATCH /organizations/:orgId/members/:userId
Authorization: Bearer <token>
```

**Request Body**

```json
{
  "roleId": "role_..."
}
```

---

## Admin Endpoints

Admin endpoints require admin API key or admin user token.

### Get Stats

```http
GET /admin/stats
Authorization: Bearer <admin_token>
```

### List Users

```http
GET /admin/users
Authorization: Bearer <admin_token>
```

**Query Parameters**

| Parameter | Description |
|-----------|-------------|
| page | Page number (default: 1) |
| limit | Items per page (default: 20) |
| search | Search by email or name |

### Get User

```http
GET /admin/users/:userId
Authorization: Bearer <admin_token>
```

### Update User

```http
PATCH /admin/users/:userId
Authorization: Bearer <admin_token>
```

### Suspend User

```http
POST /admin/users/:userId/suspend
Authorization: Bearer <admin_token>
```

### Unsuspend User

```http
POST /admin/users/:userId/unsuspend
Authorization: Bearer <admin_token>
```

### Delete User

```http
DELETE /admin/users/:userId
Authorization: Bearer <admin_token>
```

### List Sessions

```http
GET /admin/sessions
Authorization: Bearer <admin_token>
```

### Revoke Session

```http
DELETE /admin/sessions/:sessionId
Authorization: Bearer <admin_token>
```

### List Audit Logs

```http
GET /admin/audit-logs
Authorization: Bearer <admin_token>
```

**Query Parameters**

| Parameter | Description |
|-----------|-------------|
| page | Page number |
| limit | Items per page |
| action | Filter by action type |
| userId | Filter by user ID |

---

## Webhook Endpoints

### List Webhooks

```http
GET /admin/webhooks
Authorization: Bearer <admin_token>
```

### Create Webhook

```http
POST /admin/webhooks
Authorization: Bearer <admin_token>
```

**Request Body**

```json
{
  "url": "https://example.com/webhook",
  "events": ["user.created", "session.created"],
  "secret": "webhook_secret"
}
```

### Update Webhook

```http
PATCH /admin/webhooks/:webhookId
Authorization: Bearer <admin_token>
```

### Delete Webhook

```http
DELETE /admin/webhooks/:webhookId
Authorization: Bearer <admin_token>
```

### List Webhook Deliveries

```http
GET /admin/webhooks/:webhookId/deliveries
Authorization: Bearer <admin_token>
```

---

## API Key Endpoints

### List API Keys

```http
GET /admin/api-keys
Authorization: Bearer <admin_token>
```

### Create API Key

```http
POST /admin/api-keys
Authorization: Bearer <admin_token>
```

**Request Body**

```json
{
  "name": "Production API",
  "scopes": ["read:users", "write:users"],
  "expiresIn": "30d"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "id": "key_...",
    "name": "Production API",
    "key": "sk_live_...",  // Only shown once!
    "keyPrefix": "sk_live_abc",
    "scopes": ["read:users", "write:users"],
    "expiresAt": "2024-02-15T10:00:00Z"
  }
}
```

### Revoke API Key

```http
DELETE /admin/api-keys/:keyId
Authorization: Bearer <admin_token>
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_INVALID_CREDENTIALS | Email or password is incorrect |
| AUTH_EMAIL_EXISTS | Email already registered |
| AUTH_EMAIL_NOT_VERIFIED | Email verification required |
| AUTH_MFA_REQUIRED | MFA verification required |
| AUTH_MFA_INVALID | Invalid MFA code |
| AUTH_TOKEN_EXPIRED | Access token expired |
| AUTH_TOKEN_INVALID | Invalid token |
| AUTH_RATE_LIMITED | Too many requests |
| USER_NOT_FOUND | User does not exist |
| USER_SUSPENDED | User account is suspended |
| ORG_NOT_FOUND | Organization not found |
| ORG_PERMISSION_DENIED | Insufficient permissions |
| VALIDATION_ERROR | Request validation failed |
| INTERNAL_ERROR | Internal server error |

---

## Webhook Events

| Event | Description |
|-------|-------------|
| user.created | New user registered |
| user.updated | User profile updated |
| user.deleted | User account deleted |
| session.created | New session created |
| session.revoked | Session was revoked |
| organization.created | New organization created |
| organization.updated | Organization updated |
| organization.deleted | Organization deleted |
| organization.member_added | Member joined organization |
| organization.member_removed | Member left organization |
| organization.member_updated | Member role changed |

### Webhook Payload

```json
{
  "id": "evt_...",
  "type": "user.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "id": "usr_...",
    "email": "user@example.com",
    ...
  }
}
```

### Webhook Signature

Verify webhooks using the signature header:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

