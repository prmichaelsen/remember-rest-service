# Milestone 1: Project Scaffolding & Core Integration

**Goal**: Initialize NestJS project with remember-core service providers, configuration, health endpoints, and error handling
**Duration**: 1 week
**Dependencies**: None
**Status**: Not Started

---

## Overview

This milestone establishes the foundational infrastructure for the REST service. It sets up the NestJS project, integrates remember-core as the business logic layer, creates typed configuration management, exposes public health/version endpoints, and implements the error filter that maps remember-core errors to HTTP status codes.

---

## Deliverables

### 1. NestJS Project
- Initialized NestJS project with TypeScript
- package.json with remember-core and NestJS dependencies
- tsconfig.json configured for NestJS
- ESLint and Prettier configuration
- .env.example with all required environment variables

### 2. Core Module
- Weaviate client provider (factory pattern)
- Firestore client provider (factory pattern)
- Logger provider (wrapping remember-core logger)
- Core module exporting all providers

### 3. Config Module
- Typed AppConfig interface
- Environment variable loading and validation
- Config service injectable across modules

### 4. Health Endpoints
- GET /health (returns service status)
- GET /version (returns service version)
- Public (no auth required)

### 5. Error Filter
- Global exception filter mapping AppError kinds to HTTP status codes
- Structured error response format matching remember-core's toJSON()

---

## Success Criteria

- [ ] `npm run build` compiles without errors
- [ ] `npm run start` boots NestJS server on port 8080
- [ ] GET /health returns 200 with status info
- [ ] GET /version returns 200 with version info
- [ ] Weaviate client connects successfully (with valid config)
- [ ] Firestore client initializes successfully (with valid config)
- [ ] AppError thrown in a controller returns correct HTTP status and JSON body
- [ ] All config values load from environment variables

---

## Key Files to Create

```
remember-rest-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   ├── core/
│   │   ├── core.module.ts
│   │   ├── weaviate.provider.ts
│   │   ├── firestore.provider.ts
│   │   └── logger.provider.ts
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.controller.spec.ts
│   └── common/
│       └── filters/
│           ├── app-error.filter.ts
│           └── app-error.filter.spec.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .env.example
├── .eslintrc.js
└── .prettierrc
```

---

## Tasks

1. [Task 1: Initialize NestJS Project](../tasks/milestone-1-project-scaffolding/task-1-initialize-nestjs-project.md) - Scaffold NestJS app with dependencies
2. [Task 2: Create Core Module](../tasks/milestone-1-project-scaffolding/task-2-create-core-module.md) - Weaviate, Firestore, Logger providers
3. [Task 3: Create Config Module](../tasks/milestone-1-project-scaffolding/task-3-create-config-module.md) - Typed config with env validation
4. [Task 4: Create Health Endpoints](../tasks/milestone-1-project-scaffolding/task-4-create-health-endpoints.md) - Public /health and /version routes
5. [Task 5: Create Error Filter](../tasks/milestone-1-project-scaffolding/task-5-create-error-filter.md) - AppError to HTTP status mapping

---

## Environment Variables

```env
# Server
PORT=8080
NODE_ENV=development

# Weaviate
WEAVIATE_REST_URL=http://localhost:8080
WEAVIATE_GRPC_URL=http://localhost:50051
WEAVIATE_API_KEY=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY=

# Embeddings
EMBEDDINGS_PROVIDER=
EMBEDDINGS_MODEL=
EMBEDDINGS_API_KEY=
```

---

## Testing Requirements

- [ ] Health controller unit tests (health.controller.spec.ts)
- [ ] Error filter unit tests (app-error.filter.spec.ts)
- [ ] Config service unit tests (config.service.spec.ts)

---

**Next Milestone**: [M2: Authentication & Security](milestone-2-authentication.md)
**Blockers**: None
**Notes**: This milestone has no external dependencies and can begin immediately
