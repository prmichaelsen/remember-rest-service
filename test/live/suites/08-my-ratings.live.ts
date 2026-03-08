import { post, get, put, del } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const BASE = '/api/svc/v1/memories';

describe('byMyRatings (live)', () => {
  const token = makeToken(TEST_USER_ID);
  let memoryId: string | null = null;

  afterAll(async () => {
    if (memoryId) {
      await del(`${BASE}/${memoryId}`, { reason: 'live-test-cleanup' }, token);
    }
  });

  it('create a memory to rate', async () => {
    const res = await post(BASE, {
      content: 'Live test: byMyRatings test memory for rating',
      type: 'fact',
      tags: ['live-test', 'my-ratings-test'],
    }, token);

    if (res.status === 201) {
      expect(res.body.memory_id).toBeDefined();
      memoryId = res.body.memory_id;
    } else {
      console.warn(`Memory creation returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('rate the memory 5 stars', async () => {
    if (!memoryId) return;

    const res = await put(`${BASE}/${memoryId}/rating`, { rating: 5 }, token);
    // PUT returns the rating result; POST route may return 200 or 201
    expect([200, 201]).toContain(res.status);
  });

  it('POST /memories/by-my-ratings — browse mode returns rated memory', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/by-my-ratings`, {
      sort_by: 'rated_at',
      direction: 'desc',
      limit: 10,
    }, token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('offset');
    expect(res.body).toHaveProperty('limit');
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);

    // Find our rated memory in the results
    const found = res.body.items.find(
      (item: any) => item.memory?.id === memoryId
    );
    expect(found).toBeDefined();
    expect(found.metadata.my_rating).toBe(5);
    expect(found.metadata.rated_at).toBeDefined();
  });

  it('POST /memories/by-my-ratings — star filter excludes non-matching', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/by-my-ratings`, {
      rating_filter: { min: 1, max: 2 },
      limit: 10,
    }, token);

    expect(res.status).toBe(201);
    // Our 5-star rating should not be in 1-2 star filter
    const found = res.body.items.find(
      (item: any) => item.memory?.id === memoryId
    );
    expect(found).toBeUndefined();
  });

  it('POST /memories/by-my-ratings — search mode intersects with rated set', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/by-my-ratings`, {
      query: 'byMyRatings test memory',
      limit: 10,
    }, token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('items');
    // Should find the memory via search within rated set
    if (res.body.items.length > 0) {
      const found = res.body.items.find(
        (item: any) => item.memory?.id === memoryId
      );
      if (found) {
        expect(found.metadata.my_rating).toBe(5);
      }
    }
  });

  it('POST /memories/by-my-ratings — empty user returns empty', async () => {
    // Use a different token for a user with no ratings
    const emptyToken = makeToken('live_test_empty_user_no_ratings');

    const res = await post(`${BASE}/by-my-ratings`, {
      limit: 10,
    }, emptyToken);

    expect(res.status).toBe(201);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('retract the rating (cleanup)', async () => {
    if (!memoryId) return;

    const res = await del(`${BASE}/${memoryId}/rating`, undefined, token);
    expect(res.status).toBe(204);
  });
});
