# Task 64: Implement follow_up_due Notification Handler in agentbase.me

**Milestone**: Unassigned (cross-project: agentbase.me)
**Design Reference**: None
**Estimated Time**: 2-3 hours
**Dependencies**: M18 (Follow-Up Scheduler Endpoint — complete)
**Status**: Not Started

---

## Objective

Add handling for `memory.follow_up_due` webhook events in agentbase.me so that users receive notifications when a memory's follow-up date arrives. The follow-up scanner in remember-rest-service already emits these events via Cloud Scheduler; agentbase.me currently ignores them.

---

## Context

The remember-rest-service follow-up scanner (`POST /api/internal/follow-ups/scan`) runs every minute via Cloud Scheduler. It iterates all memory collections, finds memories with `follow_up_date <= now`, and emits `memory.follow_up_due` webhook events via the EventBus. The agentbase.me webhook handler at `src/routes/api/webhooks/events.tsx` currently handles 4 event types:

- `memory.published_to_space`
- `memory.published_to_group`
- `comment.published_to_space`
- `comment.published_to_group`

It does NOT handle `memory.follow_up_due`. When this event arrives, it falls through to the default case and is silently ignored.

---

## Steps

### 1. Examine the existing webhook handler

**File**: `agentbase.me/src/routes/api/webhooks/events.tsx`

The handler uses a `switch (event.type)` pattern. Add a new case for `memory.follow_up_due`.

### 2. Determine the event payload shape

The `memory.follow_up_due` event payload from remember-core includes:
- `memory_id`: string — the memory that is due for follow-up
- `collection_name`: string — the Weaviate collection containing the memory
- `user_id`: string — the memory owner
- `follow_up_date`: string (ISO 8601) — the follow-up date that triggered the event
- `title`: string | null — the memory title (may be null; fall back to content[:80])
- `content`: string — the memory content (truncated)

Verify the exact shape by checking remember-core's `scanAndNotifyFollowUps` function and the `WebhookEvent` type definition.

### 3. Add `case 'memory.follow_up_due':` to webhook handler

In `src/routes/api/webhooks/events.tsx`, add:

```typescript
case 'memory.follow_up_due': {
  const { memory_id, user_id, title, content } = event.data;
  const displayTitle = title || content?.slice(0, 80) || 'Untitled memory';
  await onFollowUpDue({
    memoryId: memory_id,
    userId: user_id,
    title: displayTitle,
  });
  break;
}
```

### 4. Implement `onFollowUpDue` in NotificationTriggers service

Add a new method to the notification triggers service (or equivalent service that handles `onCommentPublished`, etc.):

```typescript
async function onFollowUpDue({ memoryId, userId, title }: {
  memoryId: string;
  userId: string;
  title: string;
}) {
  await createNotification({
    type: 'system',
    userId,
    title: `Follow up: ${title}`,
    body: 'This memory is due for follow-up.',
    deepLink: `/memories/${memoryId}`,
    icon: 'bell', // or appropriate icon
  });
}
```

### 5. Deliver via all three channels

Ensure the notification is delivered through:
1. **Firestore** — written to the user's notifications collection (for persistence / badge count)
2. **WebSocket** — pushed to connected clients in real-time
3. **FCM push** — sent as a push notification to mobile/desktop

This should already happen if `createNotification` follows the same pattern as comment/publish notifications.

### 6. Add unit/integration tests

- Test that `memory.follow_up_due` events are routed to `onFollowUpDue`
- Test that the notification is created with correct title, body, and deep link
- Test fallback title when `title` is null (uses content[:80])
- Test that unknown user_id doesn't crash (graceful handling)

---

## Verification

- [ ] `memory.follow_up_due` event type is handled in webhook events handler
- [ ] Notification created with title "Follow up: {title}" and deep link `/memories/{memoryId}`
- [ ] Fallback title used when memory title is null
- [ ] Notification delivered via Firestore, WebSocket, and FCM push
- [ ] Unknown/invalid user_id handled gracefully (no crash)
- [ ] Existing webhook event handling (comment/publish) unaffected
- [ ] Tests pass

---

## Expected Output

When a memory's follow-up date arrives:
1. Cloud Scheduler triggers `POST /api/internal/follow-ups/scan` on remember-rest-service
2. Scanner finds due memories, emits `memory.follow_up_due` webhook events
3. agentbase.me receives the event, creates a notification for the memory owner
4. User sees "Follow up: {title}" notification in-app and as a push notification
5. Tapping the notification navigates to `/memories/{memoryId}`

---

## Key Design Decisions

### Event Handling

| Decision | Choice | Rationale |
|---|---|---|
| Notification type | `system` | Follow-up reminders are system-generated, not user-to-user |
| Title format | `Follow up: {title}` | Clear, scannable in notification list |
| Deep link | `/memories/{memoryId}` | Takes user directly to the memory for review |
| Title fallback | `content[:80]` | Same pattern used elsewhere in agentbase.me for untitled memories |

---

## Notes

- This task is in **agentbase.me**, not remember-rest-service. Created here as a cross-project reference because the work was identified during remember-rest-service M18 follow-up scanner implementation.
- The follow-up scanner is already running in production on a 1-minute Cloud Scheduler cadence.
- Remember-core's `scanAndNotifyFollowUps` already emits events; this task only adds the receiver side.

---

**Next Task**: None (standalone)
**Related Design Docs**: None
**Estimated Completion Date**: TBD
