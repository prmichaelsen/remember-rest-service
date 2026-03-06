import { Controller, Get, Inject, Param } from '@nestjs/common';
import type { MemoryIndexService } from '@prmichaelsen/remember-core/services';
import { getMemoryIndexPath } from '@prmichaelsen/remember-core/database/firestore';
import { ConfigService } from '../config/config.service.js';
import { MEMORY_INDEX } from '../core/core.providers.js';
import { Public } from '../auth/decorators.js';

@Public()
@Controller()
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    @Inject(MEMORY_INDEX) private readonly memoryIndex: MemoryIndexService,
  ) {}

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

  @Get('debug/index/:uuid')
  async debugIndex(@Param('uuid') uuid: string) {
    const indexPath = getMemoryIndexPath();
    try {
      const result = await this.memoryIndex.lookup(uuid);
      return { indexPath, uuid, result, error: null };
    } catch (err: any) {
      return { indexPath, uuid, result: null, error: err.message };
    }
  }
}
