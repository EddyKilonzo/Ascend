import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendMailOptions {
  to:       string;
  subject:  string;
  html:     string;
  text?:    string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = config.get<string>('SMTP_FROM', 'ASCEND <noreply@ascend.app>');

    this.transporter = nodemailer.createTransport({
      host:   config.get<string>('SMTP_HOST', 'smtp-relay.brevo.com'),
      port:   config.get<number>('SMTP_PORT', 587),
      secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: config.get<string>('SMTP_USER', ''),
        pass: config.get<string>('SMTP_PASS', ''),
      },
    });
  }

  /**
   * Sends an email via Brevo SMTP.
   * Errors are caught and logged without crashing the calling request —
   * email delivery failures are non-fatal by design.
   */
  async send(options: SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from:    this.from,
        to:      options.to,
        subject: options.subject,
        html:    options.html,
        text:    options.text ?? options.html.replace(/<[^>]+>/g, ''),
      });
      this.logger.log(`Email sent to ${options.to} — subject: "${options.subject}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`, error);
      return false;
    }
  }

  /** Sends the email verification email to a newly registered user. */
  async sendVerificationEmail(to: string, displayName: string, token: string): Promise<void> {
    const frontendUrl   = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verifyLink    = `${frontendUrl}/auth/verify-email?token=${token}`;

    await this.send({
      to,
      subject: 'Verify your Ascend email',
      html:    this.verificationTemplate(displayName, verifyLink),
    });
  }

  /** Sends the password reset email. */
  async sendPasswordResetEmail(to: string, displayName: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetLink   = `${frontendUrl}/auth/reset-password?token=${token}`;

    await this.send({
      to,
      subject: 'Reset your Ascend password',
      html:    this.passwordResetTemplate(displayName, resetLink),
    });
  }

  /** Sends a welcome email after successful email verification. */
  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to Ascend — Level Up Your Life',
      html:    this.welcomeTemplate(displayName),
    });
  }

  // ─── Email templates ─────────────────────────────────────────────────────

  private verificationTemplate(name: string, link: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#1A312C;padding:32px 40px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">ASCEND</h1>
              <p style="color:#428475;margin:4px 0 0;font-size:13px;">Level Up Your Life</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#091413;font-size:20px;font-weight:600;margin:0 0 12px;">
                Verify your email, ${name}
              </h2>
              <p style="color:#64748B;font-size:15px;line-height:1.6;margin:0 0 28px;">
                You are one step away from leveling up. Click the button below to verify your email and activate your account.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#428475;border-radius:8px;">
                    <a href="${link}"
                      style="display:block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94A3B8;font-size:13px;text-align:center;margin:0;">
                This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="color:#94A3B8;font-size:12px;text-align:center;margin:0;">
                Ascend &mdash; All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private passwordResetTemplate(name: string, link: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset password</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#1A312C;padding:32px 40px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:700;margin:0;">ASCEND</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#091413;font-size:20px;font-weight:600;margin:0 0 12px;">
                Reset your password, ${name}
              </h2>
              <p style="color:#64748B;font-size:15px;line-height:1.6;margin:0 0 28px;">
                We received a request to reset your password. Click below to create a new one.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#428475;border-radius:8px;">
                    <a href="${link}"
                      style="display:block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94A3B8;font-size:13px;text-align:center;margin:0;">
                This link expires in 1 hour. If you did not request a password reset, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private welcomeTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to Ascend</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:linear-gradient(135deg,#428475,#1A312C);padding:40px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:28px;font-weight:700;margin:0;">ASCEND</h1>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:6px 0 0;">Level Up Your Life</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#091413;font-size:22px;font-weight:600;margin:0 0 16px;">
                Welcome, ${name}!
              </h2>
              <p style="color:#64748B;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Your account is now active. You are ready to build habits, crush goals, and track your growth — one day at a time.
              </p>
              <p style="color:#64748B;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Start by creating your first habit or setting a goal. Maya, your AI productivity coach, will guide you through the rest.
              </p>
              <p style="color:#94A3B8;font-size:13px;margin:0;">
                The Ascend team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
