# BastionAuth - Manual Test Scenarios

This document contains comprehensive manual test scenarios for authentication and MFA flows. Execute these tests before each release.

## Prerequisites

- Local development environment running (server on `:3001`, frontend on `:3000`, admin on `:3002`)
- Test database seeded with test users
- TOTP authenticator app available (Google Authenticator, Authy, etc.)
- Access to email inbox for test accounts

---

## 1. User Registration Tests

### TC-REG-001: Sign Up with Valid Credentials
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | User is not authenticated, no existing account |

**Steps:**
1. Navigate to `/sign-up`
2. Enter a unique email: `test-[timestamp]@example.com`
3. Enter a strong password: `SecurePassword123!`
4. Enter first name: `Test`
5. Enter last name: `User`
6. Click "Sign Up" button

**Expected Results:**
- [ ] Account is created successfully
- [ ] User receives a verification email
- [ ] User is redirected to dashboard or verification pending page
- [ ] Session is created with access token
- [ ] Refresh token cookie is set (HttpOnly, Secure in production)

---

### TC-REG-002: Sign Up with Weak Password
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | None |

**Steps:**
1. Navigate to `/sign-up`
2. Enter email: `test@example.com`
3. Enter weak password: `123` or `password`
4. Click "Sign Up" button

**Expected Results:**
- [ ] Form validation error is displayed
- [ ] Error message indicates password requirements (8+ chars, uppercase, lowercase, number, special char)
- [ ] Account is NOT created
- [ ] No session tokens are issued

---

### TC-REG-003: Sign Up with Existing Email
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Account with `test@example.com` exists |

**Steps:**
1. Navigate to `/sign-up`
2. Enter existing email: `test@example.com`
3. Enter password: `SecurePassword123!`
4. Click "Sign Up" button

**Expected Results:**
- [ ] Error message indicates email already in use
- [ ] No duplicate account is created
- [ ] Error message does NOT reveal if email exists vs invalid (for security)

---

### TC-REG-004: Sign Up with Invalid Email Format
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | None |

**Steps:**
1. Navigate to `/sign-up`
2. Enter invalid email: `not-an-email`
3. Enter password: `SecurePassword123!`
4. Click "Sign Up" button

**Expected Results:**
- [ ] Form validation error for invalid email format
- [ ] Account is NOT created

---

### TC-REG-005: Sign Up with Breached Password
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | HIBP integration enabled |

**Steps:**
1. Navigate to `/sign-up`
2. Enter email: `test-breach@example.com`
3. Enter commonly breached password: `Password123!`
4. Click "Sign Up" button

**Expected Results:**
- [ ] Warning about password appearing in data breaches
- [ ] User can choose to proceed with warning or select new password

---

## 2. User Sign In Tests

### TC-AUTH-001: Sign In with Valid Credentials
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Account exists and is verified |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email: `test@example.com`
3. Enter password: `Test123!`
4. Click "Sign In" button

**Expected Results:**
- [ ] User is signed in successfully
- [ ] User is redirected to `/dashboard`
- [ ] Access token is received
- [ ] Refresh token cookie is set
- [ ] User menu/profile shows correct user info

---

### TC-AUTH-002: Sign In with Invalid Password
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Account exists |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email: `test@example.com`
3. Enter wrong password: `WrongPassword123!`
4. Click "Sign In" button

**Expected Results:**
- [ ] Error: "Invalid credentials" (generic message)
- [ ] User is NOT signed in
- [ ] Failed attempt is counted for rate limiting

---

### TC-AUTH-003: Sign In with Non-Existent Email
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical (Security) |
| **Precondition** | Email does not exist in system |

**Steps:**
1. Navigate to `/sign-in`
2. Enter non-existent email: `nonexistent@example.com`
3. Enter any password
4. Click "Sign In" button

**Expected Results:**
- [ ] Error: "Invalid credentials" (same message as wrong password)
- [ ] Response time is similar to valid email attempt (timing attack prevention)
- [ ] No indication that email doesn't exist

---

### TC-AUTH-004: Account Lockout After Failed Attempts
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical (Security) |
| **Precondition** | Account exists, not locked |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email: `test@example.com`
3. Enter wrong password 5+ times consecutively
4. Wait for rate limit window
5. Try with correct password

**Expected Results:**
- [ ] After 5 failed attempts, account is temporarily locked
- [ ] Error indicates temporary lockout
- [ ] Audit log captures failed attempts
- [ ] After lockout period, user can sign in with correct password

---

### TC-AUTH-005: Sign In with Banned Account
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Account is banned by admin |

**Steps:**
1. Navigate to `/sign-in`
2. Enter banned user credentials
3. Click "Sign In" button

**Expected Results:**
- [ ] Error indicates account is locked/banned
- [ ] User is NOT signed in
- [ ] HTTP 423 Locked status returned

---

## 3. OAuth Sign In Tests

### TC-OAUTH-001: Sign In with Google OAuth
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Google OAuth configured |

**Steps:**
1. Navigate to `/sign-in`
2. Click "Sign in with Google" button
3. Complete Google authentication
4. Authorize application

**Expected Results:**
- [ ] User is redirected to Google OAuth consent screen
- [ ] After authorization, user is redirected back
- [ ] Account is created or linked if email matches
- [ ] User is signed in with tokens
- [ ] Audit log records OAuth sign-in

---

### TC-OAUTH-002: Sign In with GitHub OAuth
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | GitHub OAuth configured |

**Steps:**
1. Navigate to `/sign-in`
2. Click "Sign in with GitHub" button
3. Complete GitHub authentication
4. Authorize application

**Expected Results:**
- [ ] User is redirected to GitHub OAuth consent screen
- [ ] After authorization, user is redirected back
- [ ] Account is created or linked
- [ ] User is signed in with tokens

---

### TC-OAUTH-003: OAuth Account Linking
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Email/password account exists, OAuth not linked |

**Steps:**
1. Navigate to `/sign-in`
2. Click OAuth provider button (same email as existing account)
3. Complete OAuth flow

**Expected Results:**
- [ ] OAuth account is linked to existing user
- [ ] User is signed in
- [ ] OAuth connection shown in user settings

---

## 4. MFA Setup Tests

### TC-MFA-001: Enable TOTP MFA
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Signed in, MFA not enabled |

**Steps:**
1. Navigate to `/settings`
2. Find "Two-Factor Authentication" section
3. Click "Enable 2FA" or "Setup"
4. Scan QR code with authenticator app
5. Enter 6-digit TOTP code from app
6. Click "Verify"

**Expected Results:**
- [ ] QR code is displayed with TOTP secret
- [ ] Manual entry code is available for copy
- [ ] After verification, MFA is enabled
- [ ] 10 backup codes are displayed (store these!)
- [ ] User is prompted to save backup codes

---

### TC-MFA-002: Generate New Backup Codes
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | MFA enabled, signed in |

**Steps:**
1. Navigate to `/settings`
2. Find MFA section
3. Click "Regenerate Backup Codes"
4. Confirm action (may require password)

**Expected Results:**
- [ ] Old backup codes are invalidated
- [ ] 10 new backup codes are generated
- [ ] New codes are displayed for user to save
- [ ] Audit log records code regeneration

---

### TC-MFA-003: Disable MFA
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | MFA enabled, signed in |

**Steps:**
1. Navigate to `/settings`
2. Find MFA section
3. Click "Disable 2FA"
4. Enter current TOTP code to confirm
5. Confirm action

**Expected Results:**
- [ ] MFA is disabled
- [ ] User can sign in without MFA
- [ ] TOTP secret is deleted
- [ ] Backup codes are invalidated
- [ ] Audit log records MFA disabled

---

## 5. MFA Sign In Tests

### TC-MFA-AUTH-001: Sign In with TOTP
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | MFA enabled on account |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email and password
3. Click "Sign In"
4. MFA challenge screen appears
5. Enter 6-digit TOTP from authenticator app
6. Click "Verify"

**Expected Results:**
- [ ] After password, MFA challenge is presented
- [ ] Valid TOTP code completes sign-in
- [ ] User is redirected to dashboard
- [ ] Session is created

---

### TC-MFA-AUTH-002: Sign In with Invalid TOTP
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | MFA enabled |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email and password
3. Enter invalid TOTP code: `000000`
4. Click "Verify"

**Expected Results:**
- [ ] Error: "Invalid code"
- [ ] User remains on MFA challenge screen
- [ ] Failed attempt is counted
- [ ] After 5 failed attempts, MFA challenge expires

---

### TC-MFA-AUTH-003: Sign In with Backup Code
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | MFA enabled, backup codes available |

**Steps:**
1. Navigate to `/sign-in`
2. Enter email and password
3. On MFA challenge, click "Use backup code"
4. Enter a valid backup code
5. Click "Verify"

**Expected Results:**
- [ ] Backup code is accepted
- [ ] User is signed in
- [ ] That specific backup code is consumed (cannot reuse)
- [ ] 9 backup codes remain

---

### TC-MFA-AUTH-004: Backup Code Already Used
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | MFA enabled, backup code previously used |

**Steps:**
1. Navigate to `/sign-in`
2. Enter credentials
3. On MFA challenge, use a previously used backup code

**Expected Results:**
- [ ] Error: "Invalid or used backup code"
- [ ] User is NOT signed in

---

## 6. Password Reset Tests

### TC-PWD-001: Request Password Reset
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Account exists |

**Steps:**
1. Navigate to `/sign-in`
2. Click "Forgot password?"
3. Enter email: `test@example.com`
4. Click "Send Reset Link"

**Expected Results:**
- [ ] Success message: "If account exists, reset link sent"
- [ ] Email is received with reset link
- [ ] Reset token expires after 24 hours

---

### TC-PWD-002: Password Reset - Non-Existent Email
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical (Security) |
| **Precondition** | Email does not exist |

**Steps:**
1. Navigate to forgot password
2. Enter non-existent email
3. Submit

**Expected Results:**
- [ ] Same success message as existing email (no enumeration)
- [ ] No email is sent
- [ ] Response time is similar to valid request

---

### TC-PWD-003: Reset Password with Valid Token
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Valid reset token from email |

**Steps:**
1. Click reset link from email
2. Enter new password: `NewSecurePassword123!`
3. Confirm new password
4. Click "Reset Password"

**Expected Results:**
- [ ] Password is changed
- [ ] All active sessions are revoked
- [ ] User can sign in with new password
- [ ] Audit log records password reset

---

### TC-PWD-004: Reset Password - Expired Token
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Reset token older than 24 hours |

**Steps:**
1. Click old reset link from email
2. Attempt to reset password

**Expected Results:**
- [ ] Error: "Token expired"
- [ ] Password is NOT changed
- [ ] User is prompted to request new reset

---

## 7. Session Management Tests

### TC-SESSION-001: Sign Out Current Session
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Signed in |

**Steps:**
1. Click user menu
2. Click "Sign Out"

**Expected Results:**
- [ ] User is signed out
- [ ] Redirected to sign-in page
- [ ] Session is revoked on server
- [ ] Refresh token cookie is cleared
- [ ] Cannot access protected routes

---

### TC-SESSION-002: Sign Out All Sessions
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Signed in on multiple devices |

**Steps:**
1. Navigate to `/settings/sessions`
2. Click "Sign Out All Devices"
3. Confirm action

**Expected Results:**
- [ ] All sessions except current are revoked
- [ ] Other devices are signed out
- [ ] Current session remains active
- [ ] Audit log records mass sign-out

---

### TC-SESSION-003: Token Refresh
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Signed in, access token near expiry |

**Steps:**
1. Wait for access token to expire (15 minutes)
2. Make authenticated request

**Expected Results:**
- [ ] Refresh token is used automatically
- [ ] New access token is issued
- [ ] Request succeeds
- [ ] User stays signed in

---

### TC-SESSION-004: View Active Sessions
| Field | Value |
|-------|-------|
| **Priority** | P3 - Medium |
| **Precondition** | Signed in |

**Steps:**
1. Navigate to `/settings/sessions`
2. View list of sessions

**Expected Results:**
- [ ] All active sessions are listed
- [ ] Each session shows device, browser, location, last active
- [ ] Current session is marked
- [ ] Individual sessions can be revoked

---

## 8. Email Verification Tests

### TC-EMAIL-001: Verify Email
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Unverified account, verification email received |

**Steps:**
1. Click verification link from email
2. (May need to sign in)

**Expected Results:**
- [ ] Email is marked as verified
- [ ] User profile shows verified status
- [ ] Audit log records verification

---

### TC-EMAIL-002: Resend Verification Email
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Signed in, email not verified |

**Steps:**
1. Navigate to settings or verification pending page
2. Click "Resend verification email"

**Expected Results:**
- [ ] New verification email is sent
- [ ] Old verification token may be invalidated
- [ ] Rate limit prevents spam

---

## 9. Rate Limiting Tests

### TC-RATE-001: Sign In Rate Limit
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical (Security) |
| **Precondition** | None |

**Steps:**
1. Make 6 rapid sign-in attempts

**Expected Results:**
- [ ] After 5 attempts, 429 Too Many Requests
- [ ] Error message indicates rate limiting
- [ ] Wait period before retry

---

### TC-RATE-002: Sign Up Rate Limit
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | None |

**Steps:**
1. Make 4 rapid sign-up attempts

**Expected Results:**
- [ ] After 3 attempts, 429 Too Many Requests
- [ ] Wait period before retry

---

## 10. Admin Dashboard Tests

### TC-ADMIN-001: Access Admin Dashboard
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Signed in as admin |

**Steps:**
1. Navigate to admin dashboard (`:3002`)
2. Sign in with admin credentials

**Expected Results:**
- [ ] Dashboard loads with statistics
- [ ] User count, session count, org count displayed
- [ ] Navigation to all admin sections works

---

### TC-ADMIN-002: Non-Admin Access Denied
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical (Security) |
| **Precondition** | Signed in as regular user |

**Steps:**
1. Attempt to access admin API endpoints
2. Attempt to navigate to admin routes

**Expected Results:**
- [ ] 403 Forbidden on all admin endpoints
- [ ] User cannot access admin UI
- [ ] No privilege escalation possible

---

### TC-ADMIN-003: Ban User
| Field | Value |
|-------|-------|
| **Priority** | P1 - Critical |
| **Precondition** | Admin signed in, target user exists |

**Steps:**
1. Navigate to Users in admin
2. Find target user
3. Click "Ban"
4. Set duration (optional) or permanent
5. Confirm

**Expected Results:**
- [ ] User is banned
- [ ] All user sessions are revoked
- [ ] User cannot sign in
- [ ] Audit log records admin action

---

### TC-ADMIN-004: View Audit Logs
| Field | Value |
|-------|-------|
| **Priority** | P2 - High |
| **Precondition** | Admin signed in |

**Steps:**
1. Navigate to Audit Logs
2. Apply filters (date range, action type)
3. View log entries

**Expected Results:**
- [ ] Audit logs are displayed
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Log details are accessible

---

## Execution Checklist

| Date | Tester | Environment | Browser | Results |
|------|--------|-------------|---------|---------|
|      |        |             |         |         |

## Sign-off

- [ ] All P1 tests passed
- [ ] All P2 tests passed
- [ ] P3 tests reviewed
- [ ] Security tests verified
- [ ] Performance acceptable

**Tested By:** _________________
**Date:** _________________
**Approved By:** _________________

