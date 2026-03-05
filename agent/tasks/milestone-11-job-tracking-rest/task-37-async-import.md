# Task 37: Migrate Import to Async

**Milestone**: [M11 - Job Tracking REST](../../milestones/milestone-11-job-tracking-rest.md)
**Estimated Time**: 2-3 hours
**Dependencies**: [Task 36](task-36-create-jobs-controller.md)
**Status**: Not Started

---

## Objective

Convert `POST /api/svc/v1/memories/import` from synchronous (200 with results) to asynchronous (202 with `job_id`). The endpoint creates a job, dispatches `ImportJobWorker.execute()` in the background, and returns immediately.

---

## Context

Current implementation in `MemoriesController.importMemories()`:
1. Creates `ImportService` inline
2. Calls `importService.import(dto)` synchronously
3. Returns the full result (200)

New implementation:
1. Creates job via `JobService.create({ type: 'import', ... })`
2. Dispatches `ImportJobWorker.execute(jobId, userId, params)` asynchronously (fire-and-forget)
3. Returns 202 with `{ job_id }` and `Location: /api/svc/v1/jobs/{job_id}` header

The worker handles chunking, step tracking, cancellation, and completion — all via `JobService`.

---

## Steps

### 1. Inject JobService
Add `@Inject(JOB_SERVICE) private readonly jobService: JobService` to `MemoriesController` constructor.

### 2. Update import endpoint

```typescript
@Post('import')
@HttpCode(202)
@Header('Content-Type', 'application/json')
async importMemories(
  @User() userId: string,
  @Body() dto: ImportMemoriesDto,
  @Res({ passthrough: true }) res: Response,
) {
  const job = await this.jobService.create({
    type: 'import',
    user_id: userId,
    params: { items: dto.items, chunk_size: dto.chunk_size },
    ttl_hours: DEFAULT_TTL_HOURS.import,
  });

  res.header('Location', `/api/svc/v1/jobs/${job.id}`);

  // Fire-and-forget: run worker after response
  const memoryService = await this.getService(userId);
  const relationshipService = await this.getRelationshipService(userId);
  const worker = new ImportJobWorker(
    this.jobService, memoryService, relationshipService,
    this.haikuClient!, this.logger,
  );

  setImmediate(() => {
    worker.execute(job.id, userId, {
      items: dto.items,
      chunk_size: dto.chunk_size,
    }).catch((err) => {
      this.logger.error('Import job failed', { job_id: job.id, error: String(err) });
    });
  });

  return { job_id: job.id };
}
```

### 3. Update ImportMemoriesDto
Add optional `chunk_size` field to DTO if not already present.

### 4. Update existing import tests
Existing tests for the import endpoint need to expect:
- 202 status code (not 200)
- `{ job_id }` response body
- Worker called asynchronously

### 5. Add new tests
- Job is created with correct params
- 202 returned with `job_id`
- Location header set
- Worker dispatched (mock and verify call)
- HaikuClient null → error thrown before job creation

---

## Verification

- [ ] `POST /memories/import` returns 202 with `{ job_id: string }`
- [ ] Response includes `Location` header
- [ ] Job created in Firestore with status 'pending'
- [ ] Worker starts executing after response sent
- [ ] Existing tests updated and passing
- [ ] New tests pass
- [ ] Build succeeds

---

**Next Task**: [Task 38: Integration tests](task-38-integration-tests.md)
**Notes**: The `setImmediate` approach works on Cloud Run since the request doesn't terminate the instance. For very long imports, a Cloud Run Job might be better, but this is sufficient for MVP.
