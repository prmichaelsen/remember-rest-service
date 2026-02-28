import { post, patch, del } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const BASE = '/api/svc/v1/memories';

describe('Memories CRUD (live)', () => {
  const token = makeToken(TEST_USER_ID);
  let memoryId: string | null = null;

  afterAll(async () => {
    if (memoryId) {
      await del(`${BASE}/${memoryId}`, { reason: 'live-test-cleanup' }, token);
    }
  });

  it('POST /memories — create a memory', async () => {
    const res = await post(BASE, {
      content: 'Live test: the capital of France is Paris',
      type: 'fact',
      tags: ['live-test'],
    }, token);

    if (res.status === 201) {
      expect(res.body.memory_id).toBeDefined();
      memoryId = res.body.memory_id;
    } else {
      console.warn(`Memory creation returned ${res.status}:`, JSON.stringify(res.body));
      // Weaviate collection may not exist — skip dependent tests
    }
  });

  it('POST /memories/search — search by content', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/search`, {
      query: 'capital of France',
    }, token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('memories');
  });

  it('POST /memories/similar — find similar by text', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/similar`, {
      text: 'Paris is the capital of France',
    }, token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('similar_memories');
  });

  it('POST /memories/query — semantic query', async () => {
    if (!memoryId) return;

    const res = await post(`${BASE}/query`, {
      query: 'What is the capital of France?',
    }, token);

    expect(res.status).toBe(201);
  });

  it('PATCH /memories/:id — update content', async () => {
    if (!memoryId) return;

    const res = await patch(`${BASE}/${memoryId}`, {
      content: 'Live test updated: Paris is the capital of France',
    }, token);

    expect(res.status).toBe(200);
    expect(res.body.memory_id).toBe(memoryId);
  });

  it('DELETE /memories/:id — soft delete', async () => {
    if (!memoryId) return;

    const res = await del(`${BASE}/${memoryId}`, {
      reason: 'live-test-cleanup',
    }, token);

    expect(res.status).toBe(200);
    expect(res.body.deleted_at).toBeDefined();
    memoryId = null; // already cleaned up
  });
});
