# BastionAuth API Documentation - Admin Endpoints

## Overview

Admin endpoints provide user management, session control, audit logging, and system administration capabilities. All admin endpoints require authentication with an admin role.

## Authentication

All admin endpoints require:

```http
Authorization: Bearer <admin_access_token>
```

The authenticated user must have `isSystemAdmin: true` in their `privateMetadata`.

---

## Dashboard Statistics

### Get Dashboard Stats

```http
GET /admin/stats
```

**Response (200 OK):**

```json
{
  "totalUsers": 1247,
  "activeUsers": 892,
  "activeSessions": 2341,
  "totalOrganizations": 45,
  "newUsersToday": 23,
  "newUsersThisWeek": 156,
  "mfaEnabledUsers": 423
}
```

---

## User Management

### List Users

```http
GET /admin/users
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | - | Search by email, name, username |
| `status` | string | - | Filter by status: `active`, `banned`, `unverified` |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | Sort order: `asc`, `desc` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "clx123...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "emailVerified": true,
      "banned": false,
      "mfaEnabled": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "lastSignInAt": "2024-01-20T08:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1247,
    "totalPages": 63
  }
}
```

---

### Get User Details

```http
GET /admin/users/:id
```

**Response (200 OK):**

```json
{
  "id": "clx123...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "emailVerified": true,
  "banned": false,
  "bannedReason": null,
  "bannedUntil": null,
  "mfaEnabled": true,
  "publicMetadata": {
    "role": "user"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T08:15:00Z",
  "lastSignInAt": "2024-01-20T08:15:00Z",
  "oauthAccounts": [
    {
      "provider": "google",
      "providerAccountId": "1234567890",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "sessions": [
    {
      "id": "sess_abc123",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-20T08:15:00Z",
      "expiresAt": "2024-01-27T08:15:00Z"
    }
  ],
  "organizations": [
    {
      "id": "org_xyz789",
      "name": "Acme Inc",
      "role": "admin"
    }
  ]
}
```

---

### Update User

```http
PATCH /admin/users/:id
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |
| `username` | string | Username |
| `emailVerified` | boolean | Email verification status |
| `publicMetadata` | object | Public metadata (visible to user) |
| `privateMetadata` | object | Private metadata (admin only) |

**Request Example:**

```json
{
  "firstName": "Jonathan",
  "publicMetadata": {
    "role": "premium"
  }
}
```

**Response (200 OK):**

Returns updated user object.

---

### Ban User

```http
POST /admin/users/:id/ban
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Reason for ban |
| `duration` | number | No | Ban duration in seconds (null = permanent) |

**Request Example:**

```json
{
  "reason": "Violation of terms of service",
  "duration": 86400
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "banned": true,
    "bannedReason": "Violation of terms of service",
    "bannedUntil": "2024-01-21T10:30:00Z"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Cannot ban yourself |
| 404 | User not found |

---

### Unban User

```http
POST /admin/users/:id/unban
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "id": "clx123...",
    "banned": false,
    "bannedReason": null,
    "bannedUntil": null
  }
}
```

---

### Delete User

```http
DELETE /admin/users/:id
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User and all associated data deleted."
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Cannot delete yourself |
| 404 | User not found |

---

### Impersonate User

```http
POST /admin/users/:id/impersonate
```

Start acting as another user (for support purposes).

**Response (200 OK):**

```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresAt": "2024-01-15T10:45:00Z"
  },
  "impersonating": {
    "userId": "clx123...",
    "email": "user@example.com"
  }
}
```

> **Note:** Impersonation is logged in the audit trail.

---

## Session Management

### List All Sessions

```http
GET /admin/sessions
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `userId` | string | - | Filter by user ID |
| `active` | boolean | - | Filter by active status |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "sess_abc123",
      "userId": "clx123...",
      "userEmail": "user@example.com",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "city": "San Francisco",
      "country": "US",
      "createdAt": "2024-01-20T08:15:00Z",
      "expiresAt": "2024-01-27T08:15:00Z",
      "lastActiveAt": "2024-01-20T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 2341,
    "totalPages": 118
  }
}
```

---

### Revoke Session

```http
DELETE /admin/sessions/:id
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### Revoke All User Sessions

```http
DELETE /admin/users/:id/sessions
```

**Response (200 OK):**

```json
{
  "success": true,
  "sessionsRevoked": 5
}
```

---

## Audit Logs

### List Audit Logs

```http
GET /admin/audit-logs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `action` | string | Filter by action type |
| `actorId` | string | Filter by actor (user) ID |
| `entityType` | string | Filter by entity type |
| `entityId` | string | Filter by entity ID |
| `startDate` | string | Start date (ISO 8601) |
| `endDate` | string | End date (ISO 8601) |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "log_abc123",
      "action": "user.signed_in",
      "actorType": "USER",
      "actorId": "clx123...",
      "entityType": "session",
      "entityId": "sess_xyz789",
      "metadata": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      },
      "createdAt": "2024-01-20T08:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 15234,
    "totalPages": 762
  }
}
```

### Audit Log Actions

| Action | Description |
|--------|-------------|
| `user.signed_up` | User created account |
| `user.signed_in` | User signed in |
| `user.signed_out` | User signed out |
| `user.password_reset` | User reset password |
| `user.mfa_enabled` | User enabled MFA |
| `user.mfa_disabled` | User disabled MFA |
| `admin.user_banned` | Admin banned a user |
| `admin.user_unbanned` | Admin unbanned a user |
| `admin.user_deleted` | Admin deleted a user |
| `admin.session_revoked` | Admin revoked a session |
| `admin.impersonation_started` | Admin started impersonation |
| `admin.impersonation_ended` | Admin ended impersonation |

---

### Export Audit Logs

```http
GET /admin/audit-logs/export
```

**Query Parameters:**

Same as List Audit Logs, plus:

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | Export format: `csv`, `json` |

**Response:**

Returns file download with Content-Disposition header.

---

## API Keys

### List API Keys

```http
GET /admin/api-keys
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "key_abc123",
      "name": "Production API",
      "keyPrefix": "sk_live_abc...",
      "scopes": ["users:read", "users:write"],
      "lastUsedAt": "2024-01-20T08:15:00Z",
      "expiresAt": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create API Key

```http
POST /admin/api-keys
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Key name |
| `scopes` | array | No | Permission scopes |
| `expiresAt` | string | No | Expiration date |

**Request Example:**

```json
{
  "name": "Production API",
  "scopes": ["users:read", "users:write"],
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Response (201 Created):**

```json
{
  "id": "key_abc123",
  "name": "Production API",
  "key": "sk_live_abc123xyz...",
  "scopes": ["users:read", "users:write"],
  "expiresAt": "2025-01-01T00:00:00Z",
  "createdAt": "2024-01-20T10:30:00Z"
}
```

> **Warning:** The full API key is only returned once. Store it securely.

---

### Revoke API Key

```http
DELETE /admin/api-keys/:id
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

## Organizations

### List Organizations

```http
GET /admin/organizations
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "org_abc123",
      "name": "Acme Inc",
      "slug": "acme-inc",
      "memberCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3
  }
}
```

---

### Get Organization Details

```http
GET /admin/organizations/:id
```

**Response (200 OK):**

```json
{
  "id": "org_abc123",
  "name": "Acme Inc",
  "slug": "acme-inc",
  "publicMetadata": {},
  "privateMetadata": {},
  "createdAt": "2024-01-01T00:00:00Z",
  "members": [
    {
      "userId": "clx123...",
      "email": "owner@acme.com",
      "role": "owner",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Webhooks

### List Webhooks

```http
GET /admin/webhooks
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://example.com/webhook",
      "events": ["user.signed_up", "user.deleted"],
      "active": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Webhook

```http
POST /admin/webhooks
```

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["user.signed_up", "user.deleted"]
}
```

**Response (201 Created):**

```json
{
  "id": "wh_abc123",
  "url": "https://example.com/webhook",
  "events": ["user.signed_up", "user.deleted"],
  "secret": "whsec_abc123...",
  "active": true,
  "createdAt": "2024-01-20T10:30:00Z"
}
```

---

### Update Webhook

```http
PATCH /admin/webhooks/:id
```

**Request Body:**

```json
{
  "url": "https://new-url.com/webhook",
  "events": ["user.signed_up"],
  "active": false
}
```

---

### Delete Webhook

```http
DELETE /admin/webhooks/:id
```

**Response (200 OK):**

```json
{
  "success": true
}
```

---

### Webhook Event Types

| Event | Description |
|-------|-------------|
| `user.signed_up` | New user registered |
| `user.signed_in` | User signed in |
| `user.updated` | User profile updated |
| `user.deleted` | User account deleted |
| `session.created` | New session created |
| `session.revoked` | Session revoked |
| `organization.created` | New organization created |
| `organization.member_added` | Member added to org |
| `organization.member_removed` | Member removed from org |


