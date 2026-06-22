import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((o) => o.trim()),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
}));
