import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  host:     process.env.SMTP_HOST     || 'smtp-relay.brevo.com',
  port:     parseInt(process.env.SMTP_PORT || '587', 10),
  secure:   process.env.SMTP_SECURE   === 'true',
  user:     process.env.SMTP_USER     || '',
  password: process.env.SMTP_PASS     || '',
  from:     process.env.SMTP_FROM     || 'ASCEND <noreply@ascend.app>',
}));
