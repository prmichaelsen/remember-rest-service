# Task 21: Deploy to Production

**Milestone**: [M5 - Cloud Run Deployment](../../milestones/milestone-5-cloud-run-deployment.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 20
**Status**: Not Started

---

## Objective

Deploy the service to the production Cloud Run environment after e1 validation.

---

## Context

Production deployment follows the same process as e1 but with production secrets and stricter configuration (locked CORS, production log levels, etc.).

---

## Steps

### 1. Create Production Secrets

Set up Secret Manager entries for production environment.

### 2. Deploy via Cloud Build

Submit cloud build targeting production service name.

### 3. Smoke Test

Verify health, auth, and basic operations against production.

### 4. Integrate with agentbase.me

Configure agentbase.me to use the production REST service URL.

---

## Verification

- [ ] Service deployed to Cloud Run (production)
- [ ] /health returns 200
- [ ] Auth flow works with production JWT
- [ ] CORS locked to agentbase.me
- [ ] agentbase.me can successfully call REST endpoints

---

**Next Task**: None (project complete for initial scope)
**Related Design Docs**: [REST API Architecture](../../design/local.rest-api-architecture.md)
