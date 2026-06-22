import {
  Injectable,
  Logger,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import {
  InvalidCredentialsException,
  AccountNotVerifiedException,
  AccountDisabledException,
  InvalidTokenException,
  TwoFactorRequiredException,
} from '../../../common/exceptions/http-exceptions';
import { GoogleProfile } from '../strategies/google.strategy';
import { GithubProfile } from '../strategies/github.strategy';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:       PrismaService,
    private readonly jwt:          JwtService,
    private readonly config:       ConfigService,
    private readonly usersService: UsersService,
    private readonly events:       EventEmitter2,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    try {
      const [existingEmail, existingUsername] = await Promise.all([
        this.prisma.user.findUnique({ where: { email: dto.email } }),
        this.prisma.user.findUnique({ where: { username: dto.username } }),
      ]);

      if (existingEmail)    throw new ConflictException('An account with this email already exists');
      if (existingUsername) throw new ConflictException('This username is already taken');

      const hashedPassword = await bcrypt.hash(dto.password, 12);

      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email:       dto.email,
            username:    dto.username,
            displayName: dto.displayName,
            timezone:    dto.timezone ?? 'UTC',
          },
        });

        await tx.userAuthProvider.create({
          data: {
            userId:     newUser.id,
            provider:   AuthProvider.EMAIL,
            providerId: newUser.id,
            accessToken: hashedPassword,
          },
        });

        await tx.userLevel.create({
          data: {
            userId:       newUser.id,
            level:        1,
            currentXp:    0,
            totalXp:      0,
            xpToNextLevel: 100,
          },
        });

        return newUser;
      });

      const verificationToken = uuidv4();
      await this.prisma.emailVerification.create({
        data: {
          userId:    user.id,
          token:     verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      this.events.emit('auth.registered', { user, verificationToken, ipAddress });

      return { message: 'Registration successful. Please verify your email.' };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error('Register error', error);
      throw error;
    }
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where:   { email: dto.email },
        include: {
          authProviders: {
            where: { provider: AuthProvider.EMAIL },
          },
        },
      });

      if (!user) throw new InvalidCredentialsException();
      if (!user.isActive) throw new AccountDisabledException();

      // Account lockout — protects against brute-force attacks
      if (user.lockUntil && user.lockUntil > new Date()) {
        const wait = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
        throw new AccountDisabledException(`Account temporarily locked. Try again in ${wait} minute(s).`);
      }

      const authProvider = user.authProviders[0];
      if (!authProvider?.accessToken) throw new InvalidCredentialsException();

      const passwordValid = await bcrypt.compare(dto.password, authProvider.accessToken);
      if (!passwordValid) {
        // Increment failed login counter; lock for 15 min after 10 consecutive failures
        const newAttempts = (user.failedLoginAttempts ?? 0) + 1;
        const lockUntil   = newAttempts >= 10
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null;
        await this.prisma.user.update({
          where: { id: user.id },
          data:  { failedLoginAttempts: newAttempts, ...(lockUntil ? { lockUntil } : {}) },
        });
        throw new InvalidCredentialsException();
      }

      // Reset failed login counter on successful password check
      if ((user.failedLoginAttempts ?? 0) > 0) {
        await this.prisma.user.update({
          where: { id: user.id },
          data:  { failedLoginAttempts: 0, lockUntil: null },
        });
      }

      if (!user.isEmailVerified) throw new AccountNotVerifiedException();

      if (user.isTwoFaEnabled) {
        if (!dto.totpCode) throw new TwoFactorRequiredException();
        const isValid = speakeasy.totp.verify({
          secret:   user.twoFaSecret!,
          encoding: 'base32',
          token:    dto.totpCode,
          window:   1,
        });
        if (!isValid) throw new UnauthorizedException('Invalid two-factor code');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);

      this.events.emit('auth.login', { userId: user.id, ipAddress });

      return {
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id:          user.id,
          email:       user.email,
          username:    user.username,
          displayName: user.displayName,
          avatarUrl:   user.avatarUrl,
          role:        user.role,
        },
      };
    } catch (error) {
      if (
        error instanceof InvalidCredentialsException ||
        error instanceof AccountDisabledException  ||
        error instanceof AccountNotVerifiedException ||
        error instanceof TwoFactorRequiredException  ||
        error instanceof UnauthorizedException
      ) throw error;

      this.logger.error('Login error', error);
      throw error;
    }
  }

  async oauthLogin(
    profile:   GoogleProfile | GithubProfile,
    provider:  AuthProvider,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      if (!profile.email) {
        throw new BadRequestException('OAuth provider did not return an email address');
      }

      let user = await this.prisma.user.findUnique({ where: { email: profile.email } });

      if (!user) {
        user = await this.prisma.$transaction(async (tx) => {
          const baseUsername = profile.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
          let username = baseUsername;
          let attempt  = 0;
          const MAX_USERNAME_ATTEMPTS = 20;
          while (attempt < MAX_USERNAME_ATTEMPTS && await tx.user.findUnique({ where: { username } })) {
            username = `${baseUsername}_${++attempt}`;
          }
          if (attempt >= MAX_USERNAME_ATTEMPTS) {
            username = `${baseUsername}_${Date.now()}`;
          }

          const newUser = await tx.user.create({
            data: {
              email:           profile.email,
              username,
              displayName:     profile.displayName || username,
              avatarUrl:       profile.avatarUrl,
              isEmailVerified: true,
            },
          });

          await tx.userAuthProvider.create({
            data: { userId: newUser.id, provider, providerId: profile.providerId },
          });

          await tx.userLevel.create({
            data: { userId: newUser.id, level: 1, currentXp: 0, totalXp: 0, xpToNextLevel: 100 },
          });

          return newUser;
        });
      } else {
        await this.prisma.userAuthProvider.upsert({
          where:  { provider_providerId: { provider, providerId: profile.providerId } },
          update: {},
          create: { userId: user.id, provider, providerId: profile.providerId },
        });
      }

      if (!user.isActive) throw new AccountDisabledException();

      const tokens = await this.generateTokens(user.id, user.email, user.role, ipAddress, userAgent);
      return { ...tokens, user };
    } catch (error) {
      if (error instanceof AccountDisabledException || error instanceof BadRequestException) throw error;
      this.logger.error('OAuth login error', error);
      throw error;
    }
  }

  async refreshTokens(userId: string, sessionId: string, rawRefreshToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session expired. Please log in again.');
      }

      // Verify the raw token matches the stored SHA-256 hash (prevents DB dump replay attacks)
      const incomingHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      if (incomingHash !== session.refreshTokenHash) {
        // Hash mismatch — potential token reuse attack: revoke all sessions for this user
        await this.prisma.session.updateMany({
          where: { userId, isRevoked: false },
          data:  { isRevoked: true },
        });
        throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
      }

      if (!session.user.isActive) throw new UnauthorizedException('Account inactive.');

      // Rotate: revoke current session before issuing new one
      await this.prisma.session.update({
        where: { id: sessionId },
        data:  { isRevoked: true },
      });

      const tokens = await this.generateTokens(
        session.user.id,
        session.user.email,
        session.user.role,
        ipAddress,
        userAgent,
      );

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error('Refresh tokens error', error);
      throw error;
    }
  }

  async logout(sessionId: string) {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data:  { isRevoked: true },
      });
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error('Logout error', error);
      throw error;
    }
  }

  async logoutAll(userId: string) {
    try {
      await this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data:  { isRevoked: true },
      });
      return { message: 'Logged out from all devices' };
    } catch (error) {
      this.logger.error('Logout all error', error);
      throw error;
    }
  }

  async verifyEmail(token: string) {
    try {
      const record = await this.prisma.emailVerification.findUnique({ where: { token } });

      if (!record)                          throw new InvalidTokenException('Verification token not found');
      if (record.verifiedAt)                throw new BadRequestException('Email already verified');
      if (record.expiresAt < new Date())    throw new InvalidTokenException('Verification token has expired');

      await this.prisma.$transaction([
        this.prisma.emailVerification.update({
          where: { token },
          data:  { verifiedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: record.userId },
          data:  { isEmailVerified: true },
        }),
      ]);

      this.events.emit('auth.email_verified', { userId: record.userId });
      return { message: 'Email verified successfully' };
    } catch (error) {
      if (error instanceof InvalidTokenException || error instanceof BadRequestException) throw error;
      this.logger.error('Verify email error', error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });

      // Always return success to prevent email enumeration
      if (!user) return { message: 'If an account with that email exists, a reset link has been sent.' };

      await this.prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data:  { usedAt: new Date() },
      });

      const token = uuidv4();
      await this.prisma.passwordReset.create({
        data: {
          userId:    user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      this.events.emit('auth.password_reset_requested', { user, token });
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    } catch (error) {
      this.logger.error('Forgot password error', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const record = await this.prisma.passwordReset.findUnique({ where: { token } });

      if (!record)                       throw new InvalidTokenException('Reset token not found');
      if (record.usedAt)                 throw new BadRequestException('Reset token has already been used');
      if (record.expiresAt < new Date()) throw new InvalidTokenException('Reset token has expired');

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await this.prisma.$transaction([
        this.prisma.passwordReset.update({
          where: { token },
          data:  { usedAt: new Date() },
        }),
        this.prisma.userAuthProvider.updateMany({
          where: { userId: record.userId, provider: AuthProvider.EMAIL },
          data:  { accessToken: hashedPassword },
        }),
      ]);

      await this.prisma.session.updateMany({
        where: { userId: record.userId },
        data:  { isRevoked: true },
      });

      this.events.emit('auth.password_reset', { userId: record.userId });
      return { message: 'Password reset successfully. Please log in with your new password.' };
    } catch (error) {
      if (error instanceof InvalidTokenException || error instanceof BadRequestException) throw error;
      this.logger.error('Reset password error', error);
      throw error;
    }
  }

  async setup2FA(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('User not found');

      const secret = speakeasy.generateSecret({ name: `Ascend (${user.email})`, length: 20 });

      await this.prisma.user.update({
        where: { id: userId },
        data:  { twoFaSecret: secret.base32 },
      });

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      return { secret: secret.base32, qrCode: qrCodeUrl };
    } catch (error) {
      this.logger.error('Setup 2FA error', error);
      throw error;
    }
  }

  async enable2FA(userId: string, totpCode: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.twoFaSecret) throw new BadRequestException('2FA setup not initiated');

      const isValid = speakeasy.totp.verify({
        secret:   user.twoFaSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
      });

      if (!isValid) throw new UnauthorizedException('Invalid TOTP code');

      await this.prisma.user.update({
        where: { id: userId },
        data:  { isTwoFaEnabled: true },
      });

      this.events.emit('auth.2fa_enabled', { userId });
      return { message: 'Two-factor authentication enabled successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      this.logger.error('Enable 2FA error', error);
      throw error;
    }
  }

  async disable2FA(userId: string, totpCode: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user?.twoFaSecret) throw new BadRequestException('2FA is not enabled');

      const isValid = speakeasy.totp.verify({
        secret:   user.twoFaSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
      });

      if (!isValid) throw new UnauthorizedException('Invalid TOTP code');

      await this.prisma.user.update({
        where: { id: userId },
        data:  { isTwoFaEnabled: false, twoFaSecret: null },
      });

      this.events.emit('auth.2fa_disabled', { userId });
      return { message: 'Two-factor authentication disabled successfully' };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) throw error;
      this.logger.error('Disable 2FA error', error);
      throw error;
    }
  }

  private async generateTokens(
    userId:     string,
    email:      string,
    role:       string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000;

    // Create session first so we have its ID for the JWT payload
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: 'pending', // replaced below after token generation
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + refreshExpiresIn),
      },
    });

    const basePayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(basePayload, {
        secret:    this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      // Include sessionId so the refresh strategy can look up the session by ID
      this.jwt.signAsync({ ...basePayload, sessionId: session.id }, {
        secret:    this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Store SHA-256 hash of the raw refresh token — never store the token itself
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.update({
      where: { id: session.id },
      data:  { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }
}
