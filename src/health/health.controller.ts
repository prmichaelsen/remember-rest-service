import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '../config/config.service.js';

@Controller()
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version')
  getVersion() {
    return {
      version: '0.1.0',
      environment: this.configService.serverConfig.nodeEnv,
    };
  }
}
