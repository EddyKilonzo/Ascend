import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest:    ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token ?? null,
        ExtractJwt.fromHeader('x-refresh-token'),
      ]),
      ignoreExpiration:  false,
      secretOrKey:       config.get<string>('JWT_REFRESH_SECRET', 'change_me_refresh'),
      passReqToCallback: true,
    });
  }

  /**
   * Passport calls this after the JWT signature is verified.
   * We pass the raw token up to the service for hash verification.
   * The actual session validity check (revoked, expired, hash match) happens in AuthService.refreshTokens
   * to prevent timing-oracle attacks from leaking session state here.
   */
  async validate(req: Request, payload: { sub: string; sessionId: string }) {
    const refreshToken =
      req?.cookies?.refresh_token ??
      (req.headers['x-refresh-token'] as string);

    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');
    if (!payload.sessionId) throw new UnauthorizedException('Invalid refresh token structure');

    return { ...payload, sessionId: payload.sessionId, refreshToken };
  }
}
