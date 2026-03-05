# Task 35: Create JobsModule

**Milestone**: [M11 - Job Tracking REST](../../milestones/milestone-11-job-tracking-rest.md)
**Estimated Time**: 1 hour
**Dependencies**: [Task 34](task-34-bump-remember-core.md)
**Status**: Not Started

---

## Objective

Create a `JobsModule` that provides `JobService` as a NestJS injectable. Register it in `AppModule`.

---

## Context

`JobService` from remember-core needs a `{ logger: Logger }` dependency. The REST service already has a `LOGGER` provider in `CoreModule`. The `JobsModule` should import `CoreModule` and create a `JOB_SERVICE` provider.

---

## Steps

### 1. Create provider symbol
Add `JOB_SERVICE` to `src/core/core.providers.ts`.

### 2. Create JobsModule
Create `src/jobs/jobs.module.ts`:
- Import `CoreModule`
- Provide `JOB_SERVICE` using factory: `new JobService({ logger })`
- Export `JOB_SERVICE`

### 3. Register in AppModule
Add `JobsModule` to `AppModule` imports.

### 4. Unit tests
Create `src/jobs/jobs.module.spec.ts`:
- Verify module compiles
- Verify `JOB_SERVICE` is provided and is a `JobService` instance

---

## Verification

- [ ] `JOB_SERVICE` symbol exists in core providers
- [ ] `JobsModule` exports `JOB_SERVICE`
- [ ] `AppModule` imports `JobsModule`
- [ ] Unit tests pass
- [ ] Build succeeds

---

**Next Task**: [Task 36: Create JobsController](task-36-create-jobs-controller.md)
