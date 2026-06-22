import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ProductivityScoreRequest, ProductivityScoreResponse,
  HabitPredictionRequest, HabitPredictionResponse,
  GoalForecastRequest, GoalForecastResponse,
  BurnoutDetectionRequest, BurnoutDetectionResponse,
  AntiCheatRequest, AntiCheatResponse,
  RecommendationRequest, RecommendationResponse,
  MayaRequest, MayaResponse,
  OcrResponse,
  MlEventPayload,
} from './ai-gateway.types';

/** Simple token-bucket circuit breaker per service endpoint. */
class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private readonly threshold: number;
  private readonly halfOpenMs: number;

  constructor(threshold = 5, halfOpenMs = 30_000) {
    this.threshold = threshold;
    this.halfOpenMs = halfOpenMs;
  }

  isOpen(): boolean {
    if (this.failures < this.threshold) return false;
    if (Date.now() > this.openUntil) {
      this.failures = Math.floor(this.threshold / 2);
      return false;
    }
    return true;
  }

  recordSuccess(): void { this.failures = Math.max(0, this.failures - 1); }

  recordFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) this.openUntil = Date.now() + this.halfOpenMs;
  }
}

/** Result wrapper — every method returns success or a structured fallback. */
export type GatewayResult<T> =
  | { ok: true; data: T; latency_ms: number }
  | { ok: false; error: string; latency_ms: number };

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  private readonly aiEngine: AxiosInstance;
  private readonly aiPlatform: AxiosInstance;
  private readonly maya: AxiosInstance;
  private readonly ocr: AxiosInstance;

  private readonly breakers = {
    aiEngine: new CircuitBreaker(),
    aiPlatform: new CircuitBreaker(),
    maya: new CircuitBreaker(),
    ocr: new CircuitBreaker(),
  };

  constructor(private readonly config: ConfigService) {
    const timeout = config.get('ML_TIMEOUT_MS', 8_000);

    this.aiEngine = axios.create({
      baseURL: config.get('AI_ENGINE_URL', 'http://localhost:5000'),
      timeout,
      headers: { 'x-api-key': config.get('ML_API_KEY', 'change-me-in-production') },
    });

    this.aiPlatform = axios.create({
      baseURL: config.get('AI_PLATFORM_URL', 'http://localhost:5001'),
      timeout,
      headers: { 'x-api-key': config.get('ML_API_KEY', 'change-me-in-production') },
    });

    this.maya = axios.create({
      baseURL: config.get('MAYA_URL', 'http://localhost:5002'),
      timeout: config.get('MAYA_TIMEOUT_MS', 12_000),
      headers: { 'x-api-key': config.get('ML_API_KEY', 'change-me-in-production') },
    });

    this.ocr = axios.create({
      baseURL: config.get('OCR_URL', 'http://localhost:5004'),
      timeout: config.get('OCR_TIMEOUT_MS', 15_000),
      headers: { 'x-api-key': config.get('ML_API_KEY', 'change-me-in-production') },
    });
  }

  // ── AI Engine ─────────────────────────────────────────────────────────────

  async scoreProductivity(req: ProductivityScoreRequest): Promise<GatewayResult<ProductivityScoreResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/score/productivity', req));
  }

  async predictHabit(req: HabitPredictionRequest): Promise<GatewayResult<HabitPredictionResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/predict/habit', req));
  }

  async forecastGoal(req: GoalForecastRequest): Promise<GatewayResult<GoalForecastResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/predict/goal', req));
  }

  async detectBurnout(req: BurnoutDetectionRequest): Promise<GatewayResult<BurnoutDetectionResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/predict/burnout', req));
  }

  async checkAntiCheat(req: AntiCheatRequest): Promise<GatewayResult<AntiCheatResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/predict/anticheat', req));
  }

  async getRecommendations(req: RecommendationRequest): Promise<GatewayResult<RecommendationResponse>> {
    return this.call('aiEngine', () => this.aiEngine.post('/recommend/', req));
  }

  // ── Maya ──────────────────────────────────────────────────────────────────

  async coachMaya(req: MayaRequest): Promise<GatewayResult<MayaResponse>> {
    return this.call('maya', () => this.maya.post('/coach', req));
  }

  // ── OCR ───────────────────────────────────────────────────────────────────

  async processImageOcr(imageBuffer: Buffer, mimeType: string, hint: string): Promise<GatewayResult<OcrResponse>> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', imageBuffer, { contentType: mimeType, filename: 'upload' });
    form.append('hint', hint);
    return this.call('ocr', () =>
      this.ocr.post('/ocr/image', form, { headers: form.getHeaders() }),
    );
  }

  async processScreenshotOcr(imageBuffer: Buffer, mimeType: string): Promise<GatewayResult<OcrResponse>> {
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('file', imageBuffer, { contentType: mimeType, filename: 'screenshot' });
    return this.call('ocr', () =>
      this.ocr.post('/ocr/screenshot', form, { headers: form.getHeaders() }),
    );
  }

  // ── AI Platform (feature ingestion) ──────────────────────────────────────

  async ingestMlEvent(payload: MlEventPayload): Promise<GatewayResult<{ queued: boolean }>> {
    return this.call('aiPlatform', () => this.aiPlatform.post('/events/ingest', payload));
  }

  async triggerRetraining(modelName: string): Promise<GatewayResult<unknown>> {
    return this.call('aiPlatform', () =>
      this.aiPlatform.post(`/train/${modelName}`, {}),
    );
  }

  // ── Health checks ─────────────────────────────────────────────────────────

  async healthCheck(): Promise<Record<string, 'up' | 'down' | 'open'>> {
    const services: Array<[string, AxiosInstance, keyof typeof this.breakers]> = [
      ['ai_engine',   this.aiEngine,   'aiEngine'],
      ['ai_platform', this.aiPlatform, 'aiPlatform'],
      ['maya',        this.maya,       'maya'],
      ['ocr',         this.ocr,        'ocr'],
    ];

    const results = await Promise.allSettled(
      services.map(([, client]) => client.get('/health', { timeout: 2_000 })),
    );

    return Object.fromEntries(
      services.map(([name, , breaker], i) => {
        if (this.breakers[breaker].isOpen()) return [name, 'open'];
        return [name, results[i].status === 'fulfilled' ? 'up' : 'down'];
      }),
    );
  }

  // ── Internal call helper with circuit-breaker + retry ────────────────────

  private async call<T>(
    breaker: keyof typeof this.breakers,
    fn: () => Promise<{ data: T }>,
    retries = 2,
  ): Promise<GatewayResult<T>> {
    if (this.breakers[breaker].isOpen()) {
      return { ok: false, error: `circuit_open:${breaker}`, latency_ms: 0 };
    }

    const t0 = Date.now();
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const res = await fn();
        this.breakers[breaker].recordSuccess();
        return { ok: true, data: res.data, latency_ms: Date.now() - t0 };
      } catch (err) {
        attempt++;
        const isRetryable = this.isRetryable(err as AxiosError);
        if (!isRetryable || attempt > retries) {
          this.breakers[breaker].recordFailure();
          const msg = (err as AxiosError).message ?? 'unknown';
          this.logger.warn(`ai-gateway ${breaker} failed (attempt ${attempt}): ${msg}`);
          return { ok: false, error: msg, latency_ms: Date.now() - t0 };
        }
        // Exponential backoff: 200ms, 400ms
        await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt - 1)));
      }
    }

    return { ok: false, error: 'max_retries', latency_ms: Date.now() - t0 };
  }

  private isRetryable(err: AxiosError): boolean {
    if (!err.response) return true; // network error / timeout
    const status = err.response.status;
    return status === 429 || status >= 500;
  }
}
