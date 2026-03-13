import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { LOGGER } from '../core/core.providers.js';

const mockReportService = {
  create: jest.fn(),
  getById: jest.fn(),
  listByReporter: jest.fn(),
  listPending: jest.fn(),
  listByMemory: jest.fn(),
  resolve: jest.fn(),
};

jest.mock('@prmichaelsen/remember-core/services', () => ({
  ReportService: jest.fn().mockImplementation(() => mockReportService),
}));


const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: LOGGER, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get(ReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /reports', () => {
    it('should create a report with reporter_user_id from auth', async () => {
      const report = {
        id: 'report-1',
        reporter_user_id: 'user-1',
        memory_id: 'mem-1',
        reason: 'spam',
        description: '',
        status: 'pending',
        created_at: '2026-03-12T00:00:00Z',
        resolved_at: null,
        resolved_by: null,
        resolution: null,
      };
      mockReportService.create.mockResolvedValue(report);

      const result = await controller.createReport('user-1', {
        memory_id: 'mem-1',
        reason: 'spam',
      });

      expect(result).toEqual(report);
      expect(mockReportService.create).toHaveBeenCalledWith({
        reporter_user_id: 'user-1',
        memory_id: 'mem-1',
        reason: 'spam',
        description: undefined,
      });
    });

    it('should pass optional description', async () => {
      mockReportService.create.mockResolvedValue({ id: 'report-2' });

      await controller.createReport('user-1', {
        memory_id: 'mem-1',
        reason: 'harassment',
        description: 'This is offensive',
      });

      expect(mockReportService.create).toHaveBeenCalledWith({
        reporter_user_id: 'user-1',
        memory_id: 'mem-1',
        reason: 'harassment',
        description: 'This is offensive',
      });
    });
  });

  describe('GET /reports', () => {
    it('should return reports for the authenticated user', async () => {
      const reports = [{ id: 'report-1' }, { id: 'report-2' }];
      mockReportService.listByReporter.mockResolvedValue(reports);

      const result = await controller.listMyReports('user-1');

      expect(result).toEqual({ reports });
      expect(mockReportService.listByReporter).toHaveBeenCalledWith('user-1');
    });
  });

  describe('GET /reports/pending', () => {
    it('should return pending reports', async () => {
      const reports = [{ id: 'report-1', status: 'pending' }];
      mockReportService.listPending.mockResolvedValue(reports);

      const result = await controller.listPendingReports({});

      expect(result).toEqual({ reports });
      expect(mockReportService.listPending).toHaveBeenCalledWith(undefined);
    });

    it('should pass limit query param', async () => {
      mockReportService.listPending.mockResolvedValue([]);

      await controller.listPendingReports({ limit: 10 });

      expect(mockReportService.listPending).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /reports/:reportId', () => {
    it('should return a report by ID', async () => {
      const report = { id: 'report-1', status: 'pending' };
      mockReportService.getById.mockResolvedValue(report);

      const result = await controller.getReport('report-1');

      expect(result).toEqual(report);
      expect(mockReportService.getById).toHaveBeenCalledWith('report-1');
    });

    it('should throw NotFoundException when report not found', async () => {
      mockReportService.getById.mockResolvedValue(null);

      await expect(controller.getReport('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /reports/:reportId/resolve', () => {
    it('should resolve a report with resolved_by from auth', async () => {
      const resolved = {
        id: 'report-1',
        status: 'resolved',
        resolved_by: 'mod-1',
        resolution: 'Content removed',
      };
      mockReportService.resolve.mockResolvedValue(resolved);

      const result = await controller.resolveReport('mod-1', 'report-1', {
        resolution: 'Content removed',
      });

      expect(result).toEqual(resolved);
      expect(mockReportService.resolve).toHaveBeenCalledWith({
        report_id: 'report-1',
        resolved_by: 'mod-1',
        resolution: 'Content removed',
        status: undefined,
      });
    });

    it('should pass optional status override', async () => {
      mockReportService.resolve.mockResolvedValue({ id: 'report-1' });

      await controller.resolveReport('mod-1', 'report-1', {
        resolution: 'Reviewed, no action needed',
        status: 'reviewed',
      });

      expect(mockReportService.resolve).toHaveBeenCalledWith({
        report_id: 'report-1',
        resolved_by: 'mod-1',
        resolution: 'Reviewed, no action needed',
        status: 'reviewed',
      });
    });
  });

  describe('GET /reports/by-memory/:memoryId', () => {
    it('should return reports for a memory', async () => {
      const reports = [{ id: 'report-1' }];
      mockReportService.listByMemory.mockResolvedValue(reports);

      const result = await controller.listReportsByMemory('mem-1');

      expect(result).toEqual({ reports });
      expect(mockReportService.listByMemory).toHaveBeenCalledWith('mem-1');
    });
  });
});
