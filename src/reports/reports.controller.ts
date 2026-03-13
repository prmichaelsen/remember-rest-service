import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Inject,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportService } from '@prmichaelsen/remember-core/services';
import type { Logger } from '@prmichaelsen/remember-core/utils';
import { LOGGER } from '../core/core.providers.js';
import { User } from '../auth/decorators.js';
import { CreateReportDto, ResolveReportDto, ListPendingQueryDto } from './reports.dto.js';

@Controller('api/svc/v1/reports')
export class ReportsController {
  constructor(@Inject(LOGGER) private readonly logger: Logger) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReport(@User() userId: string, @Body() dto: CreateReportDto) {
    this.logger.debug('[reports] createReport called', { userId, dto });
    const svc = new ReportService(this.logger);
    const result = await svc.create({
      reporter_user_id: userId,
      memory_id: dto.memory_id,
      reason: dto.reason,
      description: dto.description,
    });
    this.logger.debug('[reports] createReport result', { id: result.id, status: result.status });
    return result;
  }

  @Get()
  async listMyReports(@User() userId: string) {
    this.logger.debug('[reports] listMyReports called', { userId });
    const svc = new ReportService(this.logger);
    const reports = await svc.listByReporter(userId);
    this.logger.debug('[reports] listMyReports result', { count: reports.length });
    return { reports };
  }

  @Get('pending')
  async listPendingReports(@Query() query: ListPendingQueryDto) {
    this.logger.debug('[reports] listPendingReports called', { limit: query.limit });
    const svc = new ReportService(this.logger);
    const reports = await svc.listPending(query.limit);
    this.logger.debug('[reports] listPendingReports result', {
      count: reports.length,
      ids: reports.map((r: any) => r.id),
    });
    return { reports };
  }

  @Get('by-memory/:memoryId')
  async listReportsByMemory(@Param('memoryId') memoryId: string) {
    this.logger.debug('[reports] listReportsByMemory called', { memoryId });
    const svc = new ReportService(this.logger);
    const reports = await svc.listByMemory(memoryId);
    this.logger.debug('[reports] listReportsByMemory result', { count: reports.length });
    return { reports };
  }

  @Get(':reportId')
  async getReport(@Param('reportId') reportId: string) {
    this.logger.debug('[reports] getReport called', { reportId });
    const svc = new ReportService(this.logger);
    const report = await svc.getById(reportId);
    this.logger.debug('[reports] getReport result', { found: !!report });
    if (!report) {
      throw new NotFoundException(`Report not found: ${reportId}`);
    }
    return report;
  }

  @Post(':reportId/resolve')
  async resolveReport(
    @User() userId: string,
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    this.logger.debug('[reports] resolveReport called', { userId, reportId, dto });
    const svc = new ReportService(this.logger);
    const result = await svc.resolve({
      report_id: reportId,
      resolved_by: userId,
      resolution: dto.resolution,
      status: dto.status,
    });
    this.logger.debug('[reports] resolveReport result', { id: result.id, status: result.status });
    return result;
  }
}
