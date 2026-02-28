# Milestone 5: Cloud Run Deployment

**Goal**: Deploy the REST service to Google Cloud Run with proper secrets management and environment configuration
**Duration**: 1 week
**Dependencies**: M1, M2, M3
**Status**: Not Started

---

## Overview

This milestone packages the service for Cloud Run deployment following the same infrastructure pattern as remember-mcp-server. It includes a multi-stage Dockerfile, Cloud Build configuration, Google Secret Manager integration, and deployment to both e1 (staging) and prod environments.

---

## Deliverables

### 1. Dockerfile
- Multi-stage build (builder + production)
- Node 20 Alpine base
- Health check configured
- Port 8080 exposed

### 2. Cloud Build Configuration
- cloudbuild.yaml for automated builds
- Container Registry push
- Cloud Run deployment step
- Secret injection from Secret Manager

### 3. Environment Setup
- e1 environment (staging)
- prod environment
- Secret Manager secrets created (remember-rest-server convention)
- Environment-specific configuration

---

## Success Criteria

- [ ] Docker image builds successfully
- [ ] Image size is reasonable (< 200MB)
- [ ] Health check passes in container
- [ ] Cloud Build pipeline completes successfully
- [ ] Service deploys to Cloud Run (e1)
- [ ] All secrets load from Secret Manager
- [ ] Service responds to requests in deployed environment
- [ ] Scale-to-zero works correctly

---

## Tasks

18. [Task 18: Create Dockerfile](../tasks/milestone-5-cloud-run-deployment/task-18-create-dockerfile.md) - Multi-stage Docker build
19. [Task 19: Cloud Build & Secrets](../tasks/milestone-5-cloud-run-deployment/task-19-cloud-build-secrets.md) - cloudbuild.yaml and Secret Manager setup
20. [Task 20: Deploy to e1](../tasks/milestone-5-cloud-run-deployment/task-20-deploy-e1.md) - Staging environment deployment
21. [Task 21: Deploy to Production](../tasks/milestone-5-cloud-run-deployment/task-21-deploy-production.md) - Production environment deployment

---

## Environment Variables

```env
# Cloud Run
GOOGLE_CLOUD_PROJECT=
CLOUD_RUN_REGION=us-central1
CLOUD_RUN_SERVICE=remember-rest-server
MIN_INSTANCES=0
MAX_INSTANCES=10
MEMORY=512Mi
CPU=1
TIMEOUT=60s
```

---

## Testing Requirements

- [ ] Docker build completes without errors
- [ ] Container starts and health check passes
- [ ] Smoke test against deployed e1 instance

---

**Next Milestone**: None (future: Web API, Notifications)
**Blockers**: GCP project access and Secret Manager permissions
**Notes**: Manual deployment initially; CI/CD triggers can be added later
