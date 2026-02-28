# Remember REST Service Architecture

**Concept**: REST API server exposing remember-core services over HTTP, hosted on Google Cloud Run
**Created**: 2026-02-28
**Status**: Design Specification

---

## Overview

This document describes the architecture for `remember-rest-service`, a NestJS-based REST API that wraps `@prmichaelsen/remember-core` and exposes its memory, relationship, space, preference, and trust services over HTTP. The service is hosted on Google Cloud Run and authenticated via JWT tokens issued by agentbase.me.

The REST service follows a **spec-first** approach: the OpenAPI spec lives in remember-core (`docs/openapi.yaml`) as the source of truth. Both this REST server and any generated client SDKs must conform to it. The initial implementation targets the service-to-service (`/api/svc/v1/`) endpoint base, with a future web-optimized API (`/api/web/v1/`) planned.

---

## Problem Statement

- **remember-core** encapsulates all memory business logic but has no HTTP interface
- **remember-mcp-server** exposes this logic via MCP/SSE, which is designed for AI agent consumption, not web app UX
- **agentbase.me** needs a REST API to power graphical web experiences (memory browsing, search, management)
- Future third-party clients need a standard REST interface

Without a REST adapter:
- Web apps must go through the MCP protocol, which is not designed for direct browser consumption
- No standard HTTP API exists for non-agent clients
- Web-specific optimizations (pagination, filtering, bulk ops) cannot be layered on top of MCP

---

## Solution

Build a NestJS REST server that:

1. Wraps remember-core services with thin controller/adapter layers
2. Validates JWT tokens for authentication (new reusable auth library)
3. Maps remember-core errors to HTTP status codes
4. Exposes endpoints under `/api/svc/v1/` following remember-core's service method structure
5. Deploys to Cloud Run with the same infrastructure pattern as remember-mcp-server

### Architecture Diagram

```
                    agentbase.me (Web App)
                           │
                    JWT Bearer Token
                           │
                           ▼
              ┌────────────────────────┐
              │   Cloud Run (NestJS)   │
              │                        │
              │  ┌──────────────────┐  │
              │  │   Auth Guard     │  │  ← JWT validation
              │  │   (new library)  │  │
              │  └────────┬─────────┘  │
              │           │            │
              │  ┌────────▼─────────┐  │
              │  │   Controllers    │  │  ← Route handling
              │  │  /api/svc/v1/*   │  │
              │  └────────┬─────────┘  │
              │           │            │
              │  ┌────────▼─────────┐  │
              │  │  remember-core   │  │  ← Business logic
              │  │    Services      │  │
              │  └────────┬─────────┘  │
              │           │            │
              └───────────┼────────────┘
                          │
              ┌───────────┼───────────┐
              │           │           │
         ┌────▼────┐ ┌───▼────┐ ┌───▼──────┐
         │Weaviate │ │Firestore│ │Embeddings│
         │(vectors)│ │ (docs) │ │ Provider │
         └─────────┘ └────────┘ └──────────┘
```

### Alternative Approaches Considered

1. **Express.js**: Simpler but lacks NestJS's module system, DI, and decorator-based routing. Rejected per user preference for NestJS.
2. **Extend remember-mcp-server**: Would couple MCP and REST concerns. Rejected to maintain clean separation.
3. **API Gateway in front of MCP**: Adds translation complexity and latency. Rejected as overengineered.

---

## Implementation

### Project Structure

```
remember-rest-service/
├── src/
│   ├── main.ts                          # NestJS bootstrap
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/
│   │   ├── config.module.ts             # Environment config
│   │   └── config.service.ts            # Typed config access
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.guard.ts                # JWT validation guard
│   │   └── auth.types.ts                # AuthContext, JWT payload
│   │
│   ├── core/
│   │   ├── core.module.ts               # remember-core service providers
│   │   ├── weaviate.provider.ts         # Weaviate client factory
│   │   ├── firestore.provider.ts        # Firestore client factory
│   │   └── logger.provider.ts           # Logger factory
│   │
│   ├── memories/
│   │   ├── memories.module.ts
│   │   ├── memories.controller.ts       # Memory CRUD + search
│   │   └── memories.dto.ts              # Request/response DTOs
│   │
│   ├── relationships/
│   │   ├── relationships.module.ts
│   │   ├── relationships.controller.ts
│   │   └── relationships.dto.ts
│   │
│   ├── spaces/
│   │   ├── spaces.module.ts
│   │   ├── spaces.controller.ts
│   │   └── spaces.dto.ts
│   │
│   ├── preferences/
│   │   ├── preferences.module.ts
│   │   ├── preferences.controller.ts
│   │   └── preferences.dto.ts
│   │
│   ├── confirmations/
│   │   ├── confirmations.module.ts
│   │   ├── confirmations.controller.ts
│   │   └── confirmations.dto.ts
│   │
│   ├── trust/
│   │   ├── trust.module.ts
│   │   ├── trust.controller.ts
│   │   └── trust.dto.ts
│   │
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts         # Public: /health, /version
│   │
│   └── common/
│       ├── filters/
│       │   └── app-error.filter.ts      # Maps remember-core errors → HTTP
│       ├── interceptors/
│       │   └── logging.interceptor.ts   # Request/response logging w/ PII redaction
│       └── pipes/
│           └── validation.pipe.ts       # DTO validation
│
├── Dockerfile
├── cloudbuild.yaml
├── tsconfig.json
├── package.json
└── .env.example
```

### Endpoint Map

All authenticated endpoints require `Authorization: Bearer <jwt>` header.

#### Memories (`/api/svc/v1/memories`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| POST | `/memories` | `MemoryService.create` | Create memory |
| POST | `/memories/search` | `MemoryService.search` | Hybrid search |
| POST | `/memories/similar` | `MemoryService.findSimilar` | Vector similarity |
| POST | `/memories/query` | `MemoryService.query` | Semantic query |
| PATCH | `/memories/:id` | `MemoryService.update` | Update memory |
| DELETE | `/memories/:id` | `MemoryService.delete` | Soft delete |

#### Relationships (`/api/svc/v1/relationships`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| POST | `/relationships` | `RelationshipService.create` | Create relationship |
| POST | `/relationships/search` | `RelationshipService.search` | Search relationships |
| PATCH | `/relationships/:id` | `RelationshipService.update` | Update relationship |
| DELETE | `/relationships/:id` | `RelationshipService.delete` | Delete relationship |

#### Spaces (`/api/svc/v1/spaces`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| POST | `/spaces/publish` | `SpaceService.publish` | Publish to space |
| POST | `/spaces/retract` | `SpaceService.retract` | Retract from space |
| POST | `/spaces/revise` | `SpaceService.revise` | Propose revision |
| POST | `/spaces/moderate` | `SpaceService.moderate` | Moderate content |
| POST | `/spaces/search` | `SpaceService.search` | Search shared spaces |
| POST | `/spaces/query` | `SpaceService.query` | Semantic query spaces |

#### Confirmations (`/api/svc/v1/confirmations`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| POST | `/confirmations/:token/confirm` | `SpaceService.confirm` | Confirm action |
| POST | `/confirmations/:token/deny` | `SpaceService.deny` | Deny action |

#### Preferences (`/api/svc/v1/preferences`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| GET | `/preferences` | `PreferencesService.getPreferences` | Get user prefs |
| PATCH | `/preferences` | `PreferencesService.updatePreferences` | Update user prefs |

#### Trust (`/api/svc/v1/trust`)

| Method | Path | Service Method | Description |
|--------|------|----------------|-------------|
| GET | `/trust/ghost-config` | `GhostConfigService.get` | Get ghost config |
| PATCH | `/trust/ghost-config` | `GhostConfigService.update` | Update ghost config |
| POST | `/trust/check-access` | `TrustEnforcementService.checkMemoryAccess` | Check access |

#### Health (Public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/version` | Version info |

### Response Format

Follows remember-core's existing types:

**Success (single entity)**:
```json
{
  "data": { "id": "...", "content": "...", ... }
}
```

**Success (search/list)**:
```json
{
  "data": {
    "memories": [...],
    "relationships": [...],
    "total": 42,
    "offset": 0,
    "limit": 20
  }
}
```

**Success (paginated)**:
```json
{
  "data": {
    "items": [...],
    "total": 42,
    "cursor": "abc123",
    "hasMore": true
  }
}
```

**Error**:
```json
{
  "error": {
    "kind": "validation",
    "message": "Content is required",
    "context": { "field": "content" }
  }
}
```

### Error Mapping

The `AppErrorFilter` maps remember-core errors to HTTP responses:

```typescript
@Catch(AppError)
export class AppErrorFilter implements ExceptionFilter {
  catch(error: AppError, host: ArgumentsHost) {
    const status = HTTP_STATUS[error.kind]; // from remember-core
    const response = host.switchToHttp().getResponse();
    response.status(status).json({
      error: error.toJSON(),
    });
  }
}
```

| Error Kind | HTTP Status |
|------------|-------------|
| `validation` | 400 |
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `not_found` | 404 |
| `conflict` | 409 |
| `rate_limit` | 429 |
| `external` | 502 |
| `internal` | 500 |

### Authentication

JWT tokens are validated via a NestJS guard. The auth library will be designed in this project and implemented as a separate reusable package.

**JWT Payload** (issued by agentbase.me):
```typescript
interface JWTPayload {
  sub: string;          // userId
  iss: 'agentbase.me';
  aud: 'svc' | 'web';
  iat: number;
  exp: number;
}
```

**Auth Guard** extracts `userId` and attaches it to the request:
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request);
    const payload = verifyJWT(token, this.config.serviceToken);
    request.userId = payload.sub;
    return true;
  }
}
```

**Group ACL**: Retrieved from agentbase.me `/api/credentials/agentbase` or passed in request headers. Exact mechanism TBD based on what's simplest.

### Configuration

```typescript
interface AppConfig {
  server: {
    port: number;               // default: 8080
    corsOrigin: string;         // default: 'https://agentbase.me'
  };
  auth: {
    serviceToken: string;       // JWT signing secret
    issuer: string;             // 'agentbase.me'
  };
  weaviate: {
    restUrl: string;
    grpcUrl: string;
    apiKey: string;
  };
  firebase: {
    projectId: string;
    serviceAccountKey: string;
  };
  embeddings: {
    provider: string;
    model: string;
    apiKey: string;
  };
  rateLimit: {
    maxRequests: number;        // default: 100
    windowMs: number;           // default: 3600000 (1 hour)
  };
}
```

---

## Benefits

- **Code Reuse**: All business logic lives in remember-core; this service is a thin adapter
- **Standard Interface**: REST is universally consumable by web apps, mobile, and third-party clients
- **Independent Scaling**: REST service scales independently from MCP server
- **NestJS Ecosystem**: Modules, guards, interceptors, pipes provide clean separation of concerns
- **Consistent with Existing Infrastructure**: Same Cloud Run pattern, secrets, and databases as remember-mcp-server

---

## Trade-offs

- **Additional Service**: One more service to deploy and maintain (mitigated by sharing remember-core and infrastructure patterns)
- **NestJS Overhead**: Heavier than Express for a thin adapter (mitigated by NestJS benefits for future growth: modules, DI, decorators)
- **Auth Library**: Building a new reusable auth library adds scope (mitigated by delegating implementation to a separate agent/project)
- **Shared Database**: REST service and MCP server share Weaviate/Firestore (acceptable since remember-core handles concurrency at the service level)

---

## Dependencies

### Runtime
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` - NestJS framework
- `@prmichaelsen/remember-core` - Business logic SDK
- `jsonwebtoken` - JWT validation (until auth library is ready)
- `class-validator`, `class-transformer` - DTO validation

### Infrastructure
- **Weaviate** - Vector database (shared with remember-mcp-server)
- **Firestore** - Document storage (shared with remember-mcp-server)
- **Embeddings Provider** - For semantic search vectorization
- **Google Cloud Run** - Hosting
- **Google Secret Manager** - Secrets

### Other Design Documents
- Auth library design (to be created, scoped from this project)

---

## Testing Strategy

Tests are colocated next to the source files they test.

### File Naming Convention
- **Unit tests**: `*.spec.ts` (colocated next to source)
- **Integration/E2E tests**: `*.e2e.ts` (colocated next to source)

Example:
```
src/memories/
├── memories.controller.ts
├── memories.controller.spec.ts      # Unit test
├── memories.controller.e2e.ts       # Integration test
├── memories.dto.ts
└── memories.module.ts
```

### Unit Tests (`.spec.ts`)
- Controller tests with mocked remember-core services
- Auth guard tests with valid/invalid/expired JWTs
- Error filter tests mapping each error kind to correct HTTP status
- DTO validation tests

### Integration Tests (`.e2e.ts`)
- End-to-end request flow with test Weaviate/Firestore instances
- Auth flow: missing token, invalid token, expired token, valid token
- CRUD lifecycle for each entity type
- Search/query with various filter combinations

### Coverage Goals
- Controllers: 80%+
- Guards/Filters/Interceptors: 90%+
- Integration: Key happy paths and error paths

---

## Migration Path

This is a new service, no migration needed. Deployment steps:

1. Initialize NestJS project with remember-core dependency
2. Implement core module (Weaviate, Firestore, Logger providers)
3. Implement auth guard with JWT validation
4. Implement controllers for each service (memories first)
5. Implement error filter and logging interceptor
6. Create Dockerfile and cloudbuild.yaml
7. Deploy to Cloud Run (`e1` environment first, then `prod`)
8. Integrate with agentbase.me

---

## Future Considerations

- **Web-Optimized API** (`/api/web/v1/`): Aggregated endpoints designed for app-first experiences (memory + relationships in one call, dashboard stats, recent activity)
- **Client/Secret Scheme**: Service account authentication for machine-to-machine communication
- **Notifications Service**: WebSocket/SSE endpoint for real-time updates (memory changes, moderation actions)
- **OpenAPI Spec Evolution**: Spec currently maintained by hand in remember-core; could later be validated against NestJS decorators via `@nestjs/swagger`
- **PII Redaction**: Logging interceptor with content-aware redaction before structured log output

---

**Status**: Design Specification
**Recommendation**: Begin implementation with project scaffolding (NestJS init, remember-core integration, auth guard, memories controller) as a first milestone
**Related Documents**:
- Source: agent/drafts/requirements.draft.md
- Clarification: agent/clarifications/clarification-1-rest-api-requirements.md
- OpenAPI Spec (source of truth): ~/.acp/projects/remember-core/docs/openapi.yaml
- Reference: agent/design/core-sdk.architecture.md
- Reference: agent/patterns/core-sdk.adapter-rest.md
