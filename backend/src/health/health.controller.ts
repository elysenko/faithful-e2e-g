import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators';
import { PrismaService } from 'src/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService
  ) {}

  // Shallow liveness probe — no I/O. Reachable at /api/health; used by the
  // k8s liveness/readiness probes.
  @Get()
  @Public()
  check() {
    return { status: 'ok' };
  }

  // Deep readiness probe — verifies the database connection with SELECT 1.
  // Reachable at /api/health/deep.
  @Get('deep')
  @Public()
  @HealthCheck()
  deep() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }

  @Get('live')
  @Public()
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
