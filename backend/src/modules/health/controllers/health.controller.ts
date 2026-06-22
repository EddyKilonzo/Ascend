import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck, HealthCheckService, PrismaHealthIndicator,
  MemoryHealthIndicator, HttpHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health:  HealthCheckService,
    private readonly prisma:  PrismaHealthIndicator,
    private readonly memory:  MemoryHealthIndicator,
    private readonly http:    HttpHealthIndicator,
    private readonly db:      PrismaService,
    private readonly config:  ConfigService,
  ) {}

  /** Public health check — used by load balancers, uptime monitors, and devops dashboards. */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check (includes ML services)' })
  check() {
    const apiKey = this.config.get('ML_API_KEY', '');
    const headers = apiKey ? { 'x-api-key': apiKey } : {};

    return this.health.check([
      () => this.prisma.pingCheck('database', this.db),
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      () => this.http.pingCheck(
        'ml_ai_engine',
        `${this.config.get('AI_ENGINE_URL', 'http://localhost:5000')}/health`,
        { httpClient: { headers }, timeout: 3_000 },
      ),
      () => this.http.pingCheck(
        'ml_ai_platform',
        `${this.config.get('AI_PLATFORM_URL', 'http://localhost:5001')}/health`,
        { httpClient: { headers }, timeout: 3_000 },
      ),
      () => this.http.pingCheck(
        'ml_maya',
        `${this.config.get('MAYA_URL', 'http://localhost:5002')}/health`,
        { httpClient: { headers }, timeout: 3_000 },
      ),
      () => this.http.pingCheck(
        'ml_ocr',
        `${this.config.get('OCR_URL', 'http://localhost:5004')}/health`,
        { httpClient: { headers }, timeout: 3_000 },
      ),
    ]);
  }
}
