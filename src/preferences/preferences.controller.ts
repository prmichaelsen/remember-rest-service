import { Controller, Get, Patch, Body, Inject } from '@nestjs/common';
import { PreferencesDatabaseService } from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { LOGGER } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import { UpdatePreferencesDto } from './preferences.dto.js';

@Controller('api/svc/v1/preferences')
export class PreferencesController {
  private readonly preferencesService: PreferencesDatabaseService;

  constructor(@Inject(LOGGER) private readonly logger: Logger) {
    this.preferencesService = new PreferencesDatabaseService(logger);
  }

  @Get()
  async getPreferences(@User() userId: string) {
    return this.preferencesService.getPreferences(userId);
  }

  @Patch()
  async updatePreferences(
    @User() userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.preferencesService.updatePreferences(userId, dto as any);
  }
}
