# Task 3: Create Config Module

**Milestone**: [M1 - Project Scaffolding & Core Integration](../../milestones/milestone-1-project-scaffolding.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 1
**Status**: Not Started

---

## Objective

Create a typed configuration module that loads and validates environment variables, providing a strongly-typed ConfigService injectable across the application.

---

## Context

The service requires configuration for server, auth, Weaviate, Firebase, embeddings, rate limiting, and CORS. A centralized config module ensures all values are validated at startup and consistently accessed.

---

## Steps

### 1. Define AppConfig Interface

Define the typed config structure matching the design doc (server, auth, weaviate, firebase, embeddings, rateLimit sections).

### 2. Create Config Service

Implement ConfigService that reads from process.env and validates required values. Should fail fast at startup if required config is missing.

### 3. Create Config Module

NestJS module that registers ConfigService as a global provider.

### 4. Write Unit Tests

Test config loading with valid values, missing required values, and default fallbacks.

---

## Verification

- [ ] ConfigService loads all values from environment
- [ ] Missing required values throw at startup with clear messages
- [ ] Default values work for optional config (port, rate limit, etc.)
- [ ] config.service.spec.ts passes

---

**Next Task**: [Task 4: Create Health Endpoints](task-4-create-health-endpoints.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
