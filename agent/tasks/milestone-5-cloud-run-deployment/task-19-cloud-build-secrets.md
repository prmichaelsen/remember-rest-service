# Task 19: Cloud Build & Secrets

**Milestone**: [M5 - Cloud Run Deployment](../../milestones/milestone-5-cloud-run-deployment.md)
**Estimated Time**: 2-3 hours
**Dependencies**: Task 18
**Status**: Not Started

---

## Objective

Create cloudbuild.yaml for automated builds and configure Google Secret Manager for all required secrets using the `remember-rest-server` naming convention.

---

## Context

Follows the same deployment pipeline as remember-mcp-server: Cloud Build builds the Docker image, pushes to Container Registry, and deploys to Cloud Run with secrets injected from Secret Manager.

---

## Steps

### 1. Create cloudbuild.yaml

- Build Docker image
- Tag with commit SHA and `latest`
- Push to Container Registry
- Deploy to Cloud Run with secret references

### 2. Document Required Secrets

Create a list of all secrets that need to be created in Secret Manager:
- PLATFORM_SERVICE_TOKEN
- CORS_ORIGIN
- WEAVIATE_REST_URL, WEAVIATE_GRPC_URL, WEAVIATE_API_KEY
- FIREBASE_PROJECT_ID, FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
- EMBEDDINGS_PROVIDER, EMBEDDINGS_MODEL, EMBEDDINGS_API_KEY

### 3. Create Secret Manager Entries

Document the gcloud commands to create each secret (manual execution).

---

## Verification

- [ ] cloudbuild.yaml is valid
- [ ] All secrets documented with creation commands
- [ ] Cloud Build submits successfully (manual test)

---

**Next Task**: [Task 20: Deploy to e1](task-20-deploy-e1.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
