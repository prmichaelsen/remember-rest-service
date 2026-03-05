# Task 34: Bump remember-core to v0.27.1

**Milestone**: [M11 - Job Tracking REST](../../milestones/milestone-11-job-tracking-rest.md)
**Estimated Time**: 0.5 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Update `@prmichaelsen/remember-core` from ^0.27.0 to ^0.27.1 to get job tracking exports (JobService, ImportJobWorker, job types). Also resolves M9 Task 31's @ts-ignore for ImportService barrel export and M10 Task 32's core bump target.

---

## Context

remember-core v0.27.1 added:
- `JobService`, `JobServiceDeps` — Firestore CRUD for job state
- `ImportJobWorker`, `ImportJobParams` — chunked import with step tracking
- `RemJobWorker`, `RemJobParams`, `scheduleRemJobs` — REM cycle as tracked job
- Job types: `Job`, `JobStep`, `JobError`, `JobType`, `JobStatus`, `JobStepStatus`
- Constants: `DEFAULT_TTL_HOURS`, `TERMINAL_STATUSES`
- All exported from `@prmichaelsen/remember-core/services`

---

## Steps

### 1. Bump dependency
```bash
npm install @prmichaelsen/remember-core@^0.27.1
```

### 2. Remove @ts-ignore in import endpoint
In `src/memories/memories.controller.ts`, the `ImportService` import should now resolve cleanly from `@prmichaelsen/remember-core/services` without any dynamic import or @ts-ignore hacks.

### 3. Verify build
```bash
npm run build && npm test
```

---

## Verification

- [ ] `package.json` shows `@prmichaelsen/remember-core: "^0.27.1"`
- [ ] No @ts-ignore comments related to ImportService
- [ ] `npm run build` succeeds
- [ ] All existing tests pass
- [ ] Can import `JobService` from `@prmichaelsen/remember-core/services`

---

**Next Task**: [Task 35: Create JobsModule](task-35-create-jobs-module.md)
**Notes**: This supersedes M10 Task 32 (bump to v0.26.1) — the target is now v0.27.1
