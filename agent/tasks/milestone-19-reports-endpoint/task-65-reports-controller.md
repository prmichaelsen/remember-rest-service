# Task 65: Reports Controller & Module

**Milestone**: M19 - Reports Endpoint (App Store Guideline 1.2)
**Design Reference**: None (OpenAPI spec in remember-core/docs/openapi.yaml is source of truth)
**Estimated Time**: 2-3 hours
**Dependencies**: remember-core >= 0.68.0 (ReportService + report types published)
**Status**: Not Started

---

## Objective

Implement the Reports REST endpoints in remember-rest-service, wiring remember-core's `ReportService` into NestJS controllers. This satisfies Apple App Store guideline 1.2 by providing a mechanism for users to flag objectionable content and for moderators to review/resolve reports.

---

## Context

Apple rejected agentbase.me for guideline 1.2 (user-generated content). The data layer (`ReportService`, report types, Firestore paths) is already implemented in remember-core. The OpenAPI spec (`docs/openapi.yaml`) defines 6 endpoints under the `reports` tag. This task creates the NestJS module, controller, DTOs, and unit tests.

---

## Steps

### 1. Bump remember-core dependency

Update `package.json` to require the version of remember-core that includes `ReportService`:

```bash
npm i @prmichaelsen/remember-core@latest
```

Verify `ReportService` is importable:
```typescript
import { ReportService } from '@prmichaelsen/remember-core/services';
```

### 2. Create Report DTOs

Create `src/reports/reports.dto.ts` with class-validator decorators:

```typescript
// CreateReportDto
// - memory_id: @IsString(), @IsNotEmpty()
// - reason: @IsString(), @IsNotEmpty()
// - description: @IsString(), @IsOptional()

// ResolveReportDto
// - resolution: @IsString(), @IsNotEmpty()
// - status: @IsIn(['reviewed', 'resolved']), @IsOptional()

// ListPendingQueryDto
// - limit: @IsInt(), @Min(1), @Max(100), @IsOptional(), @Type(() => Number)
```

### 3. Create ReportsController

Create `src/reports/reports.controller.ts` following the NestJS pattern used by other controllers:

```typescript
@Controller('api/svc/v1/reports')
export class ReportsController {
  constructor(
    @Inject(LOGGER) private logger: Logger,
  ) {}
}
```

**6 endpoints matching OpenAPI spec:**

| Decorator | Path | operationId | Notes |
|-----------|------|-------------|-------|
| `@Post()` | `/` | `createReport` | Inject `reporter_user_id` from `@User()` decorator. Return 201. |
| `@Get()` | `/` | `listMyReports` | Call `listByReporter(userId)`. |
| `@Get('pending')` | `/pending` | `listPendingReports` | Moderator-only. Accept `?limit` query param. |
| `@Get(':reportId')` | `/:reportId` | `getReport` | Return 404 if not found. |
| `@Post(':reportId/resolve')` | `/:reportId/resolve` | `resolveReport` | Moderator-only. Inject `resolved_by` from `@User()`. |
| `@Get('by-memory/:memoryId')` | `/by-memory/:memoryId` | `listReportsByMemory` | Moderator-only. |

**Service instantiation**: Create `ReportService` per-request in each handler (same pattern as other controllers — `new ReportService(this.logger)`). ReportService takes only a `Logger` constructor param.

**Moderator check**: For `listPendingReports`, `resolveReport`, and `listReportsByMemory`, use the same moderator permission pattern as `SpacesController` — check `canModerateAny(authContext)` or gate behind a simple role check. For MVP, any authenticated user can create/list their own reports; moderator endpoints require `canModerateAny`.

### 4. Create ReportsModule

Create `src/reports/reports.module.ts`:

```typescript
@Module({
  controllers: [ReportsController],
})
export class ReportsModule {}
```

Import `ReportsModule` in `AppModule` (`src/app.module.ts`).

### 5. Write Unit Tests

Create `src/reports/reports.controller.spec.ts` with colocated tests:

**Test cases:**
- `POST /` — creates report with 201, injects reporter_user_id from auth
- `POST /` — returns 400 for missing memory_id or reason
- `GET /` — returns caller's reports
- `GET /pending` — returns pending reports (moderator)
- `GET /:reportId` — returns report by ID
- `GET /:reportId` — returns 404 for missing report
- `POST /:reportId/resolve` — resolves report, injects resolved_by
- `GET /by-memory/:memoryId` — returns reports for a memory

Mock `ReportService` methods using jest.mock or manual mock construction.

### 6. Verify

Run tests:
```bash
npm test -- --testPathPattern=reports
```

---

## Verification

- [ ] `npm i @prmichaelsen/remember-core@latest` succeeds and ReportService is importable
- [ ] `src/reports/reports.dto.ts` exists with CreateReportDto, ResolveReportDto, ListPendingQueryDto
- [ ] `src/reports/reports.controller.ts` implements all 6 endpoints from OpenAPI spec
- [ ] `src/reports/reports.module.ts` exists and is imported in AppModule
- [ ] `src/reports/reports.controller.spec.ts` has 8+ test cases
- [ ] All existing tests still pass (no regressions)
- [ ] New tests pass
- [ ] `reporter_user_id` is injected from JWT (not accepted from request body)
- [ ] `resolved_by` is injected from JWT (not accepted from request body)

---

## Expected Output

**File Structure**:
```
src/reports/
├── reports.controller.ts
├── reports.controller.spec.ts
├── reports.dto.ts
└── reports.module.ts
```

**Key Files Created**:
- `reports.controller.ts`: 6 REST endpoints for content flagging
- `reports.dto.ts`: Request validation DTOs
- `reports.module.ts`: NestJS module registration
- `reports.controller.spec.ts`: Unit tests

---

## Key Design Decisions

### API Design

| Decision | Choice | Rationale |
|---|---|---|
| reporter_user_id source | JWT `sub` claim, not request body | Prevent spoofing — server resolves identity |
| resolved_by source | JWT `sub` claim, not request body | Same as above |
| Moderator gating | `canModerateAny(authContext)` for pending/resolve/by-memory | Consistent with SpacesController pattern |
| Service instantiation | `new ReportService(logger)` per handler | ReportService is stateless, only needs logger |

---

## Common Issues and Solutions

### Issue 1: ReportService not found in remember-core
**Symptom**: Import error for `ReportService`
**Solution**: Ensure remember-core >= 0.68.0 is installed. Check that `ReportService` is exported from `@prmichaelsen/remember-core/services`.

### Issue 2: Firestore not initialized
**Symptom**: Runtime error on first report creation
**Solution**: Ensure Firestore is initialized in CoreModule before ReportService is used. The existing `initFirestore()` call in core.providers.ts should handle this.

---

## Resources

- OpenAPI spec: `remember-core/docs/openapi.yaml` (reports tag)
- ReportService source: `remember-core/src/services/report.service.ts`
- Report types: `remember-core/src/types/report.types.ts`
- Existing controller reference: `src/memories/memories.controller.ts`

---

## Notes

- This is a blocking requirement for App Store approval
- The OpenAPI spec omits `reporter_user_id` and `resolved_by` from request bodies — these come from auth context
- ReportService writes to both global and user-scoped Firestore collections (dual-write pattern)
- remember-core already has 11 passing tests for ReportService

---

**Next Task**: Deploy to e1 and production
**Related Design Docs**: remember-core/docs/openapi.yaml
**Estimated Completion Date**: TBD
