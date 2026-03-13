# Milestone 20: Ordered Relationships REST Endpoints

**Status**: not_started
**Created**: 2026-03-13
**Estimated Weeks**: 0.5
**Dependencies**: remember-core ordered relationships (M77) — assumed complete

---

## Goal

Wire remember-core's ordered relationship capabilities into REST endpoints. Expose `reorder()` on the svc-tier and return position-sorted memories on the app-tier.

## Deliverables

1. **Svc-tier reorder endpoint**: `POST /api/svc/v1/relationships/:id/reorder` with discriminated-union DTO for 5 operation types and optimistic locking via `version`
2. **App-tier ordered content**: `GET /api/app/v1/relationships/:id/memories` returns items sorted by `member_order` with a `position` field per item
3. **Unit tests** for both tiers

## Success Criteria

- [ ] `POST /relationships/:id/reorder` accepts all 5 operation types and returns updated `member_order` + `version`
- [ ] Version mismatch returns 409 Conflict
- [ ] Membership mismatch on `set_order` returns 409 Conflict
- [ ] App-tier endpoint returns memories sorted by position (not alphabetically)
- [ ] Each memory item in app-tier response includes `position` field
- [ ] All existing relationship tests still pass
- [ ] New unit tests cover reorder operations + position-sorted retrieval

## Tasks

| Task | Name | Est. Hours | Status |
|---|---|---|---|
| 66 | Reorder Endpoint + DTOs | 1-2 | not_started |
| 67 | App-Tier Ordered Content Response | 1 | not_started |
| 68 | Unit Tests | 1 | not_started |

## Notes

- remember-core already has `RelationshipService.reorder()`, `ReorderRelationshipInput`, `ReorderRelationshipResult`, and `ReorderOperation` types fully implemented
- `member_order_json` is automatically populated on create/update by core — REST layer is passthrough
- Errors from core (ConflictError for version/membership mismatch) flow through AppErrorFilter → 409
- Design doc: `remember-core/agent/design/local.ordered-relationships.md`
- GUI consumer: `agentbase.me/agent/design/local.reorder-gui.md`
