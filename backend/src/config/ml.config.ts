import { registerAs } from '@nestjs/config';

export const mlConfig = registerAs('ml', () => ({
  apiKey:        process.env.ML_API_KEY ?? 'changeme-ml-api-key',
  aiEngineUrl:   process.env.AI_ENGINE_URL   ?? 'http://localhost:5000',
  platformUrl:   process.env.AI_PLATFORM_URL ?? 'http://localhost:5001',
  mayaUrl:       process.env.MAYA_URL        ?? 'http://localhost:5002',
  mayaVoiceUrl:  process.env.MAYA_VOICE_URL  ?? 'http://localhost:5003',
  ocrUrl:        process.env.OCR_URL         ?? 'http://localhost:5004',
  timeoutMs:     Number(process.env.ML_TIMEOUT_MS ?? 5_000),
}));
