import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JobsController } from './jobs.controller.js';
import { JOB_SERVICE } from '../core/core.providers.js';

const mockJobService = {
  getStatus: jest.fn(),
  cancel: jest.fn(),
  cleanupExpired: jest.fn(),
};

describe('JobsController', () => {
  let controller: JobsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        { provide: JOB_SERVICE, useValue: mockJobService },
      ],
    }).compile();

    controller = module.get(JobsController);
  });

  describe('GET /jobs/:id', () => {
    it('should return job status', async () => {
      const job = {
        id: 'job-1',
        type: 'import',
        status: 'running',
        progress: 50,
        created_at: '2026-03-05T00:00:00Z',
      };
      mockJobService.getStatus.mockResolvedValue(job);

      const result = await controller.getStatus('job-1');

      expect(result).toEqual(job);
      expect(mockJobService.getStatus).toHaveBeenCalledWith('job-1');
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobService.getStatus.mockResolvedValue(null);

      await expect(controller.getStatus('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('POST /jobs/:id/cancel', () => {
    it('should cancel job and return message', async () => {
      const job = { id: 'job-1', status: 'running' };
      mockJobService.getStatus.mockResolvedValue(job);
      mockJobService.cancel.mockResolvedValue(undefined);

      const result = await controller.cancel('job-1');

      expect(result).toEqual({ message: 'Job cancellation requested', job_id: 'job-1' });
      expect(mockJobService.cancel).toHaveBeenCalledWith('job-1');
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobService.getStatus.mockResolvedValue(null);

      await expect(controller.cancel('bad-id')).rejects.toThrow(NotFoundException);
      expect(mockJobService.cancel).not.toHaveBeenCalled();
    });
  });

  describe('POST /jobs/cleanup', () => {
    it('should return deleted count', async () => {
      mockJobService.cleanupExpired.mockResolvedValue(3);

      const result = await controller.cleanup();

      expect(result).toEqual({ deleted: 3 });
      expect(mockJobService.cleanupExpired).toHaveBeenCalled();
    });

    it('should return 0 when nothing to clean', async () => {
      mockJobService.cleanupExpired.mockResolvedValue(0);

      const result = await controller.cleanup();

      expect(result).toEqual({ deleted: 0 });
    });
  });
});
