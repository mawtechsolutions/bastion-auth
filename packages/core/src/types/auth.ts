import type { OAuthProvider } from './user.js';

/**
 * Sign up request
 */
export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

/**
 * Sign in request (password strategy)
 */
export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * Sign in response when MFA is required
 */
export interface MfaRequiredResponse {
  requiresMfa: true;
  mfaChallengeId: string;
  supportedMethods: MfaMethod[];
}

/**
 * MFA methods
 */
export type MfaMethod = 'totp' | 'backup_code';

/**
 * MFA verification request
 */
export interface MfaVerifyRequest {
  mfaChallengeId: string;
  code: string;
  method: MfaMethod;
}

/**
 * Magic link request
 */
export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

/**
 * Password forgot request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Password reset request
 */
export interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * Password change request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken?: string;
}

/**
 * Email verification request
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * OAuth initiate response
 */
export interface OAuthInitiateResponse {
  redirectUrl: string;
  state: string;
}

/**
 * OAuth callback data
 */
export interface OAuthCallbackData {
  provider: OAuthProvider;
  code: string;
  state: string;
}

/**
 * OAuth user info from provider
 */
export interface OAuthUserInfo {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
}

/**
 * MFA setup response
 */
export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * MFA enable request
 */
export interface MfaEnableRequest {
  code: string;
}

/**
 * MFA disable request
 */
export interface MfaDisableRequest {
  password: string;
}

/**
 * Backup codes regenerate request
 */
export interface RegenerateBackupCodesRequest {
  password: string;
}

/**
 * Passkey registration options response
 */
export interface PasskeyRegistrationOptionsResponse {
  options: PublicKeyCredentialCreationOptionsJSON;
}

/**
 * Passkey registration verification request
 */
export interface PasskeyRegistrationRequest {
  credential: RegistrationResponseJSON;
  name: string;
}

/**
 * Passkey authentication options response
 */
export interface PasskeyAuthenticationOptionsResponse {
  options: PublicKeyCredentialRequestOptionsJSON;
}

/**
 * Passkey authentication request
 */
export interface PasskeyAuthenticationRequest {
  credential: AuthenticationResponseJSON;
}

// WebAuthn JSON types (simplified versions)
export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { alg: number; type: 'public-key' }[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: { id: string; type: 'public-key'; transports?: string[] }[];
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: { id: string; type: 'public-key'; transports?: string[] }[];
  userVerification?: UserVerificationRequirement;
}

export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
  type: 'public-key';
  clientExtensionResults: Record<string, unknown>;
}

export interface AuthenticationResponseJSON {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  type: 'public-key';
  clientExtensionResults: Record<string, unknown>;
}

type AttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';
type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: 'platform' | 'cross-platform';
  residentKey?: 'required' | 'preferred' | 'discouraged';
  requireResidentKey?: boolean;
  userVerification?: UserVerificationRequirement;
}

