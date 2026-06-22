import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  providerId: string;
  email:      string;
  displayName: string;
  avatarUrl:  string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID:     config.get<string>('GOOGLE_CLIENT_ID')     || 'not-configured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:  config.get<string>('GOOGLE_CALLBACK_URL')  || 'http://localhost:4000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const googleProfile: GoogleProfile = {
      providerId:  profile.id,
      email:       profile.emails?.[0]?.value ?? '',
      displayName: profile.displayName ?? '',
      avatarUrl:   profile.photos?.[0]?.value ?? null,
    };
    done(null, googleProfile);
  }
}
