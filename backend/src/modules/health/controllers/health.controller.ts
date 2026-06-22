import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck, HealthCheckService, PrismaHealthIndicator, MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { PrismaService } from '../../../database/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health:  HealthCheckService,
    private readonly prisma:  PrismaHealthIndicator,
    private readonly memory:  MemoryHealthIndicator,
    private readonly db:      PrismaService,
  ) {}

  /** Public health check endpoint — used by load balancers and uptime monitors. */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System health check' })
  check() {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.db),
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }
}
