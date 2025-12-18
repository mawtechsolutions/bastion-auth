import { Resend } from 'resend';

import { env } from '../config/env.js';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private resend: Resend | null;
  private from: string;

  constructor() {
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    this.from = env.EMAIL_FROM;
  }

  /**
   * Send an email
   */
  async send(options: SendEmailOptions): Promise<void> {
    if (!this.resend) {
      console.log('[EmailService] Resend not configured, skipping email:', options.subject);
      console.log('[EmailService] To:', options.to);
      console.log('[EmailService] HTML:', options.html.substring(0, 200) + '...');
      return;
    }

    await this.resend.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify your email - BastionAuth',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111;">Verify your email</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
      Thanks for signing up! Please verify your email address by clicking the button below.
    </p>
    <a href="${verifyUrl}" style="display: inline-block; background: #111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      Verify Email
    </a>
    <p style="margin: 24px 0 0; color: #888; font-size: 14px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
    <p style="margin: 0; color: #888; font-size: 12px;">
      BastionAuth - Authentication, fortified.
    </p>
  </div>
</body>
</html>`,
      text: `Verify your email by visiting: ${verifyUrl}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.send({
      to: email,
      subject: 'Reset your password - BastionAuth',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111;">Reset your password</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: #111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      Reset Password
    </a>
    <p style="margin: 24px 0 0; color: #888; font-size: 14px;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
    <p style="margin: 0; color: #888; font-size: 12px;">
      BastionAuth - Authentication, fortified.
    </p>
  </div>
</body>
</html>`,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email: string, token: string, redirectUrl?: string): Promise<void> {
    let magicUrl = `${env.API_URL}/api/v1/auth/magic-link/verify?token=${token}`;
    if (redirectUrl) {
      magicUrl += `&redirect=${encodeURIComponent(redirectUrl)}`;
    }

    await this.send({
      to: email,
      subject: 'Sign in to BastionAuth',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111;">Sign in to BastionAuth</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
      Click the button below to sign in. This link will expire in 15 minutes.
    </p>
    <a href="${magicUrl}" style="display: inline-block; background: #111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      Sign In
    </a>
    <p style="margin: 24px 0 0; color: #888; font-size: 14px;">
      If you didn't request this link, you can safely ignore this email.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
    <p style="margin: 0; color: #888; font-size: 12px;">
      BastionAuth - Authentication, fortified.
    </p>
  </div>
</body>
</html>`,
      text: `Sign in by visiting: ${magicUrl}`,
    });
  }

  /**
   * Send organization invitation email
   */
  async sendInvitationEmail(
    email: string,
    token: string,
    organizationName: string,
    inviterName?: string
  ): Promise<void> {
    const inviteUrl = `${env.FRONTEND_URL}/accept-invitation?token=${token}`;

    await this.send({
      to: email,
      subject: `You've been invited to join ${organizationName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: #111;">You're invited!</h1>
    <p style="margin: 0 0 24px; color: #555; line-height: 1.6;">
      ${inviterName ? `${inviterName} has` : 'You have been'} invited you to join <strong>${organizationName}</strong> on BastionAuth.
    </p>
    <a href="${inviteUrl}" style="display: inline-block; background: #111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">
      Accept Invitation
    </a>
    <p style="margin: 24px 0 0; color: #888; font-size: 14px;">
      This invitation will expire in 7 days.
    </p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
    <p style="margin: 0; color: #888; font-size: 12px;">
      BastionAuth - Authentication, fortified.
    </p>
  </div>
</body>
</html>`,
      text: `You've been invited to join ${organizationName}. Accept at: ${inviteUrl}`,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

