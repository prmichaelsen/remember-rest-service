# Milestone 17: Comments Endpoint

## Goal

Wire the remember-core `createAndPublishComment` compound operation as an app-tier REST endpoint at `POST /api/app/v1/spaces/comments`.

## Background

Comments are memories with `content_type: 'comment'`, `parent_id`, and `thread_root_id` for threading. The two-step create+publish flow caused comments to silently fail when publish errored (moderation, vectorization, etc). remember-core 0.35.0 added `createAndPublishComment` in the web SDK and defined the OpenAPI spec. This milestone wires it into the REST service.

## Deliverables

1. `AppSpacesController` — app-tier controller at `api/app/v1/spaces`
2. `CreateCommentDto` — class-validator DTO for comment creation
3. Unit tests for the new controller
4. Bump remember-core to >= 0.35.0

## Success Criteria

- `POST /api/app/v1/spaces/comments` creates a comment memory and publishes to specified spaces/groups in one call
- Returns 201 with `{ memory_id, created_at, composite_id, published_to }`
- Returns 400 on validation errors (empty content, no spaces or groups)
- Returns 401 on missing auth
- Content moderation applies (same as publish)
- Unit tests passing
