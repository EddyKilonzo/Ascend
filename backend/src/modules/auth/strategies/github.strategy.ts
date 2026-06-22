import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

export interface GithubProfile {
  providerId:  string;
  email:       string;
  displayName: string;
  avatarUrl:   string | null;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly config: ConfigService) {
    super({
      clientID:     config.get<string>('GITHUB_CLIENT_ID')     || 'not-configured',
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET') || 'not-configured',
      callbackURL:  config.get<string>('GITHUB_CALLBACK_URL')  || 'http://localhost:4000/api/v1/auth/github/callback',
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: null, user: GithubProfile) => void,
  ) {
    const githubProfile: GithubProfile = {
      providerId:  profile.id,
      email:       (profile.emails?.[0]?.value) ?? '',
      displayName: profile.displayName ?? profile.username ?? '',
      avatarUrl:   profile.photos?.[0]?.value ?? null,
    };
    done(null, githubProfile);
  }
}
