import type { PrismaClient } from '@prisma/client';
import { TOTP } from 'otpauth';
import QRCode from 'qrcode';

import { MFA_CONFIG } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';
import {
  decrypt,
  encrypt,
  generateBackupCodes,
  verifyPassword,
} from '../utils/crypto.js';

export class MfaService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Initialize MFA setup - generates secret and QR code
   */
  async initSetup(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, mfaEnabled: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    if (user.mfaEnabled) {
      throw Errors.mfaAlreadyEnabled();
    }

    // Generate TOTP secret
    const totp = new TOTP({
      issuer: MFA_CONFIG.TOTP_ISSUER,
      label: user.email,
      algorithm: 'SHA1',
      digits: MFA_CONFIG.TOTP_DIGITS,
      period: MFA_CONFIG.TOTP_STEP,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(totp.toString());

    // Generate backup codes
    const backupCodes = generateBackupCodes(MFA_CONFIG.BACKUP_CODES_COUNT);

    // Temporarily store the setup data (will be confirmed on verify)
    // We encrypt and store it so it can be verified before enabling
    const encryptedSecret = encrypt(totp.secret.base32);
    const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
        mfaBackupCodes: encryptedBackupCodes,
        // Note: mfaEnabled remains false until verified
      },
    });

    return {
      secret: totp.secret.base32,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code and enable MFA
   */
  async verifyAndEnable(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, mfaSecret: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    if (user.mfaEnabled) {
      throw Errors.mfaAlreadyEnabled();
    }

    if (!user.mfaSecret) {
      throw Errors.invalidInput('MFA setup not initiated. Call setup first.');
    }

    // Verify the code
    const secret = decrypt(user.mfaSecret);
    const totp = new TOTP({
      issuer: MFA_CONFIG.TOTP_ISSUER,
      label: 'BastionAuth',
      algorithm: 'SHA1',
      digits: MFA_CONFIG.TOTP_DIGITS,
      period: MFA_CONFIG.TOTP_STEP,
      secret,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      return false;
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return true;
  }

  /**
   * Disable MFA
   */
  async disable(userId: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mfaEnabled: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    if (!user.mfaEnabled) {
      throw Errors.mfaNotEnabled();
    }

    if (!user.passwordHash) {
      throw Errors.invalidPassword();
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw Errors.invalidPassword();
    }

    // Disable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
      },
    });
  }

  /**
   * Get backup codes (requires password verification)
   */
  async getBackupCodes(userId: string, password: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mfaEnabled: true, mfaBackupCodes: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    if (!user.mfaEnabled) {
      throw Errors.mfaNotEnabled();
    }

    if (!user.passwordHash) {
      throw Errors.invalidPassword();
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw Errors.invalidPassword();
    }

    // Decrypt and return backup codes
    return user.mfaBackupCodes.map((code) => decrypt(code));
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, password: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, mfaEnabled: true },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    if (!user.mfaEnabled) {
      throw Errors.mfaNotEnabled();
    }

    if (!user.passwordHash) {
      throw Errors.invalidPassword();
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw Errors.invalidPassword();
    }

    // Generate new backup codes
    const backupCodes = generateBackupCodes(MFA_CONFIG.BACKUP_CODES_COUNT);
    const encryptedBackupCodes = backupCodes.map((code) => encrypt(code));

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: encryptedBackupCodes },
    });

    return backupCodes;
  }
}

