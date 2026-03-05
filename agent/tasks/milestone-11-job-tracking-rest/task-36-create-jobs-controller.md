# Task 36: Create JobsController

**Milestone**: [M11 - Job Tracking REST](../../milestones/milestone-11-job-tracking-rest.md)
**Estimated Time**: 2 hours
**Dependencies**: [Task 35](task-35-create-jobs-module.md)
**Status**: Not Started

---

## Objective

Create `JobsController` with three endpoints matching the remember-core OpenAPI spec:
- `GET /api/svc/v1/jobs/:id` — get job status
- `POST /api/svc/v1/jobs/:id/cancel` — cancel a running job
- `POST /api/svc/v1/jobs/cleanup` — remove expired jobs (admin/cron)

---

## Context

The OpenAPI spec in remember-core defines:
- `GET /api/svc/v1/jobs/{jobId}` — returns `Job` object (status, progress, steps, result, error)
- `POST /api/svc/v1/jobs/{jobId}/cancel` — returns `{ message, job_id }`

The cleanup endpoint is not in the public spec but is needed for TTL-based cleanup via cron or admin trigger.

---

## Steps

### 1. Create DTOs
Create `src/jobs/jobs.dto.ts`:
- No body DTOs needed (get and cancel use path params only)
- `CancelJobResponse` type (inline or DTO)

### 2. Create Controller
Create `src/jobs/jobs.controller.ts`:

```typescript
@Controller('api/svc/v1/jobs')
export class JobsController {
  constructor(@Inject(JOB_SERVICE) private readonly jobService: JobService) {}

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    const job = await this.jobService.getStatus(id);
    if (!job) throw new NotFoundException(`Job not found: ${id}`);
    return job;
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    const job = await this.jobService.getStatus(id);
    if (!job) throw new NotFoundException(`Job not found: ${id}`);
    await this.jobService.cancel(id);
    return { message: 'Job cancellation requested', job_id: id };
  }

  @Post('cleanup')
  async cleanup() {
    const deleted = await this.jobService.cleanupExpired();
    return { deleted };
  }
}
```

### 3. Register in JobsModule
Add `JobsController` to `controllers` array in `JobsModule`.

### 4. Unit tests
Create `src/jobs/jobs.controller.spec.ts`:
- `getStatus` returns job object
- `getStatus` throws 404 when not found
- `cancel` calls jobService.cancel
- `cancel` throws 404 when not found
- `cleanup` returns deleted count

---

## Verification

- [ ] `GET /api/svc/v1/jobs/:id` returns job with all fields
- [ ] `GET /api/svc/v1/jobs/:id` returns 404 for unknown job
- [ ] `POST /api/svc/v1/jobs/:id/cancel` cancels and returns message
- [ ] `POST /api/svc/v1/jobs/cleanup` returns deleted count
- [ ] All endpoints require auth (AuthGuard applied globally)
- [ ] Unit tests pass
- [ ] Build succeeds

---

**Next Task**: [Task 37: Migrate import to async](task-37-async-import.md)
