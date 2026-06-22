import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwt: {
    secret:             process.env.JWT_SECRET || 'change_me',
    expiresIn:          process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret:      process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
    refreshExpiresIn:   process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId:     process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback',
  },
  github: {
    clientId:     process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl:  process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/github/callback',
  },
}));
