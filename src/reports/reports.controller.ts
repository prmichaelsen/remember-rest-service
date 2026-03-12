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
    const svc = new ReportService(this.logger);
    return svc.create({
      reporter_user_id: userId,
      memory_id: dto.memory_id,
      reason: dto.reason,
      description: dto.description,
    });
  }

  @Get()
  async listMyReports(@User() userId: string) {
    const svc = new ReportService(this.logger);
    return svc.listByReporter(userId);
  }

  @Get('pending')
  async listPendingReports(@Query() query: ListPendingQueryDto) {
    // Use native firebase-admin directly — workaround for
    // @prmichaelsen/firebase-admin-sdk-v8 queryDocuments bug
    // with composite index queries (see bug report in firebase-admin-sdk-v8)
    const db = getFirestore();
    const limit = query.limit ?? 50;
    const snapshot = await db
      .collection('remember-mcp.reports')
      .where('status', '==', 'pending')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  @Get('by-memory/:memoryId')
  async listReportsByMemory(@Param('memoryId') memoryId: string) {
    const svc = new ReportService(this.logger);
    return svc.listByMemory(memoryId);
  }

  @Get(':reportId')
  async getReport(@Param('reportId') reportId: string) {
    const svc = new ReportService(this.logger);
    const report = await svc.getById(reportId);
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
    const svc = new ReportService(this.logger);
    return svc.resolve({
      report_id: reportId,
      resolved_by: userId,
      resolution: dto.resolution,
      status: dto.status,
    });
  }
}
