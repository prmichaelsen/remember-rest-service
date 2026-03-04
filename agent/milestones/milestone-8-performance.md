# Milestone 8: Performance

**Goal**: Improve API throughput, reduce latency, and tune rate limiting across the REST service
**Duration**: 1-2 weeks
**Dependencies**: Milestone 3 (Sort Mode Endpoints) completed
**Status**: Not Started

---

## Overview

The REST service currently has conservative defaults and no route-level tuning. The slice search endpoints fire 9-14 parallel Weaviate queries per request, making them latency-sensitive. Rate limiting is a flat 100 req/hour globally, which is too aggressive for SVC (machine-to-machine) traffic. This milestone addresses rate limiting, slice search latency, and general API performance.

---

## Deliverables

### 1. Rate Limiting Overhaul
- Per-route or per-tier rate limit configuration (SVC routes need higher limits than app routes)
- Raise default `RATE_LIMIT_MAX` for SVC routes (machine-to-machine traffic)
- `@SkipThrottle()` or custom decorator for internal health/readiness endpoints
- Environment variable support for per-tier configuration

### 2. Slice Search Latency Optimization
- Connection pooling / keep-alive for Weaviate client (avoid cold connections on parallel queries)
- Configurable timeout per bucket query (fail fast on slow buckets rather than blocking entire request)
- Response streaming or early-return for partial results when some buckets timeout
- Benchmark: measure p50/p95/p99 for by-time-slice and by-density-slice under load

### 3. General API Performance
- Enable gzip/brotli response compression (NestJS `compression` middleware)
- Add `Cache-Control` headers for GET endpoints (e.g., GET /:id)
- Weaviate client connection reuse across requests (singleton vs per-request)
- Payload size limits and pagination guard rails
- Response time logging (p50/p95/p99 per endpoint)

---

## Success Criteria

- [ ] SVC routes support at least 1000 req/hour (up from 100)
- [ ] App routes maintain separate, configurable rate limits
- [ ] Health endpoint is not rate-limited
- [ ] by-time-slice p95 latency < 2s for a user with 1000+ memories
- [ ] by-density-slice p95 latency < 2s for a user with 1000+ memories
- [ ] Response compression enabled (gzip/brotli)
- [ ] No regressions: all existing tests pass
- [ ] Benchmark results documented

---

## Key Files to Modify

```
src/
├── app.module.ts                    # ThrottlerModule config, compression
├── config/
│   ├── config.types.ts              # RateLimitConfig per-tier fields
│   └── config.service.ts            # New env vars for per-tier limits
├── auth/
│   └── throttle.ts (or new file)    # Custom throttle guard / per-route config
├── memories/
│   └── memories.controller.ts       # Timeout/caching for slice endpoints
└── core/
    └── core.providers.ts            # Weaviate client singleton tuning
```

---

## Tasks

1. **Task 1**: Tiered rate limiting — separate SVC and App tier limits, skip health endpoints
2. **Task 2**: Response compression — enable gzip/brotli middleware
3. **Task 3**: Weaviate connection tuning — singleton client, keep-alive, pool settings
4. **Task 4**: Slice search timeouts — per-bucket timeout, graceful partial results
5. **Task 5**: Response time observability — per-endpoint p50/p95/p99 logging
6. **Task 6**: Benchmarking — load test slice endpoints, document baseline and improved numbers

**Total Estimated Time**: ~1-2 weeks

---

## Environment Variables

```env
# Rate Limiting - SVC tier (machine-to-machine)
RATE_LIMIT_SVC_MAX=1000
RATE_LIMIT_SVC_WINDOW_MS=3600000

# Rate Limiting - App tier (end-user browser)
RATE_LIMIT_APP_MAX=200
RATE_LIMIT_APP_WINDOW_MS=3600000

# Rate Limiting - Global fallback (existing, kept for backward compat)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=3600000

# Slice Search
SLICE_SEARCH_BUCKET_TIMEOUT_MS=3000
```

---

## Testing Requirements

- [ ] Unit tests for tiered throttle guard
- [ ] Integration test: SVC route allows higher throughput than app route
- [ ] Integration test: health endpoint not rate-limited
- [ ] Load test: by-time-slice with 14 concurrent Weaviate calls
- [ ] Load test: by-density-slice with 9 concurrent Weaviate calls
- [ ] Compression test: verify Content-Encoding header in responses

---

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Raising rate limits exposes abuse surface | Medium | Low | Monitor per-user usage, add per-user limits if needed |
| Parallel Weaviate queries overwhelm cluster | High | Medium | Add per-bucket timeouts, circuit breaker pattern |
| Compression adds CPU overhead | Low | Low | Benchmark before/after, only compress above threshold |

---

**Next Milestone**: TBD
**Blockers**: None
**Notes**: Rate limiting is the most immediate pain point (100 req/hour is blocking SVC clients). Start with Task 1.

---

**Milestone ID**: M8
**Created**: 2026-03-04
**Owner**: remember-rest-service team
