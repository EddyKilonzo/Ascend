import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from '../../../integrations/email/email.service';
import { PrismaService } from '../../../database/prisma.service';
import { AuditLogsService } from '../../audit-logs/services/audit_logs.service';
import { AuditAction } from '@prisma/client';

/**
 * Listens for auth domain events and triggers email delivery and audit logging.
 * Kept separate from AuthService to maintain single responsibility.
 */
@Injectable()
export class AuthEventsListener {
  private readonly logger = new Logger(AuthEventsListener.name);

  constructor(
    private readonly email:  EmailService,
    private readonly prisma: PrismaService,
    private readonly audit:  AuditLogsService,
  ) {}

  /** Sends email verification link after a new user registers. */
  @OnEvent('auth.registered')
  async onRegistered(payload: {
    user: { id: string; email: string; displayName: string | null };
    verificationToken: string;
  }) {
    try {
      await this.email.sendVerificationEmail(
        payload.user.email,
        payload.user.displayName ?? 'there',
        payload.verificationToken,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${payload.user.email}`, error);
    }
  }

  /** Sends a welcome email after the user verifies their email. */
  @OnEvent('auth.email_verified')
  async onEmailVerified(payload: { userId: string }) {
    try {
      const user = await this.prisma.user.findUnique({
        where:  { id: payload.userId },
        select: { email: true, displayName: true },
      });
      if (!user) return;

      await this.email.sendWelcomeEmail(user.email, user.displayName ?? 'there');
    } catch (error) {
      this.logger.error(`Failed to send welcome email for user ${payload.userId}`, error);
    }
  }

  /** Sends password reset link. */
  @OnEvent('auth.password_reset_requested')
  async onPasswordResetRequested(payload: {
    user: { email: string; displayName: string | null };
    token: string;
  }) {
    try {
      await this.email.sendPasswordResetEmail(
        payload.user.email,
        payload.user.displayName ?? 'there',
        payload.token,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${payload.user.email}`, error);
    }
  }

  // ─── Audit logging ──────────────────────────────────────────────────────────

  @OnEvent('auth.login')
  async onLogin(payload: { userId: string; ipAddress?: string }) {
    await this.audit.log({ userId: payload.userId, action: AuditAction.LOGIN, ipAddress: payload.ipAddress });
  }

  @OnEvent('auth.email_verified')
  async onEmailVerifiedAudit(payload: { userId: string }) {
    await this.audit.log({ userId: payload.userId, action: AuditAction.EMAIL_VERIFY });
  }

  @OnEvent('auth.password_reset')
  async onPasswordReset(payload: { userId: string }) {
    await this.audit.log({ userId: payload.userId, action: AuditAction.PASSWORD_CHANGE });
  }

  @OnEvent('auth.2fa_enabled')
  async on2FAEnabled(payload: { userId: string }) {
    await this.audit.log({ userId: payload.userId, action: AuditAction.TWO_FA_ENABLE });
  }

  @OnEvent('auth.2fa_disabled')
  async on2FADisabled(payload: { userId: string }) {
    await this.audit.log({ userId: payload.userId, action: AuditAction.TWO_FA_DISABLE });
  }
}
