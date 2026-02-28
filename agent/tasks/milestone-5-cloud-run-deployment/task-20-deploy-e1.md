# Task 20: Deploy to e1

**Milestone**: [M5 - Cloud Run Deployment](../../milestones/milestone-5-cloud-run-deployment.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 19
**Status**: Not Started

---

## Objective

Deploy the service to the e1 (staging) Cloud Run environment and verify it's operational.

---

## Context

The e1 environment is the staging environment used for testing before production. It shares the same infrastructure pattern but may use separate database instances or namespaces.

---

## Steps

### 1. Create e1 Secrets

Set up Secret Manager entries for e1 environment.

### 2. Deploy via Cloud Build

Submit cloud build targeting e1 service name.

### 3. Smoke Test

Verify health endpoint, auth flow, and basic CRUD operations against the deployed service.

---

## Verification

- [ ] Service deployed to Cloud Run (e1)
- [ ] /health returns 200
- [ ] Auth flow works with valid JWT
- [ ] Basic memory CRUD works end-to-end
- [ ] Scale-to-zero works (service scales down after idle)

---

**Next Task**: [Task 21: Deploy to Production](task-21-deploy-production.md)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
