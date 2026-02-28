# Task 18: Create Dockerfile

**Milestone**: [M5 - Cloud Run Deployment](../../milestones/milestone-5-cloud-run-deployment.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 1
**Status**: Not Started

---

## Objective

Create a multi-stage Dockerfile for building and running the NestJS service in production, following the same pattern as remember-mcp-server.

---

## Context

Cloud Run requires a container that listens on PORT (default 8080). The Dockerfile uses a multi-stage build: builder stage compiles TypeScript, production stage runs with minimal dependencies.

---

## Steps

### 1. Create Dockerfile

- Builder stage: Node 20 Alpine, install all deps, compile TypeScript
- Production stage: Node 20 Alpine, install production deps only, copy dist/
- Expose 8080
- Health check: `node -e "fetch('http://localhost:8080/health')"`
- CMD: `node dist/main.js`

### 2. Create .dockerignore

Exclude node_modules, .git, agent/, test files, etc.

### 3. Test Local Build

Build and run locally to verify the container starts and health check passes.

---

## Verification

- [ ] `docker build .` succeeds
- [ ] Image size < 200MB
- [ ] Container starts and /health returns 200
- [ ] .dockerignore excludes unnecessary files

---

**Next Task**: [Task 19: Cloud Build & Secrets](task-19-cloud-build-secrets.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
