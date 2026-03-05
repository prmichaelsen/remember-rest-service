import { Test } from '@nestjs/testing';
import { JOB_SERVICE, LOGGER } from '../core/core.providers.js';
import { JobService } from '@prmichaelsen/remember-core/services';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('JobsModule', () => {
  it('should provide JOB_SERVICE as a JobService instance', async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: LOGGER, useValue: mockLogger },
        {
          provide: JOB_SERVICE,
          useFactory: (logger: any) => new JobService({ logger }),
          inject: [LOGGER],
        },
      ],
    }).compile();

    const jobService = module.get(JOB_SERVICE);
    expect(jobService).toBeDefined();
    expect(jobService).toBeInstanceOf(JobService);
  });

  it('should expose create, get, and cancel methods', async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: LOGGER, useValue: mockLogger },
        {
          provide: JOB_SERVICE,
          useFactory: (logger: any) => new JobService({ logger }),
          inject: [LOGGER],
        },
      ],
    }).compile();

    const jobService = module.get(JOB_SERVICE);
    expect(typeof jobService.create).toBe('function');
    expect(typeof jobService.getStatus).toBe('function');
    expect(typeof jobService.cancel).toBe('function');
    expect(typeof jobService.cleanupExpired).toBe('function');
  });
});
