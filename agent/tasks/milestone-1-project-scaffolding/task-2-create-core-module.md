# Task 2: Create Core Module

**Milestone**: [M1 - Project Scaffolding & Core Integration](../../milestones/milestone-1-project-scaffolding.md)
**Estimated Time**: 3-4 hours
**Dependencies**: Task 1
**Status**: Not Started

---

## Objective

Create the NestJS core module that provides remember-core service instances (Weaviate client, Firestore client, Logger) as injectable providers available across the application.

---

## Context

Remember-core services require a Weaviate collection, Firestore reference, and Logger instance. This module creates factory providers that initialize these clients from configuration and exports them for use by controllers.

---

## Steps

### 1. Create Weaviate Provider

Factory provider that creates a Weaviate v3 client using config values (REST URL, gRPC URL, API key). Should expose the initialized client and relevant collections.

### 2. Create Firestore Provider

Factory provider that initializes Firebase Admin SDK and returns Firestore instance. Uses service account key from config.

### 3. Create Logger Provider

Factory provider wrapping remember-core's Logger utility with appropriate log level from config.

### 4. Create Core Module

NestJS module that registers all providers as global providers, so they're available without importing CoreModule in every feature module.

### 5. Write Unit Tests

Test that providers initialize correctly with valid config and throw meaningful errors with invalid config.

---

## Verification

- [ ] CoreModule registers and exports Weaviate, Firestore, Logger providers
- [ ] Providers are injectable in other modules
- [ ] Invalid config produces clear error messages
- [ ] core.module.spec.ts passes

---

**Next Task**: [Task 3: Create Config Module](task-3-create-config-module.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
