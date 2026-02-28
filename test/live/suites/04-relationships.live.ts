import { post, patch, del } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const MEMORIES_BASE = '/api/svc/v1/memories';
const REL_BASE = '/api/svc/v1/relationships';

describe('Relationships CRUD (live)', () => {
  const token = makeToken(TEST_USER_ID);
  let memoryId1: string | null = null;
  let memoryId2: string | null = null;
  let relationshipId: string | null = null;

  afterAll(async () => {
    if (relationshipId) {
      await del(`${REL_BASE}/${relationshipId}`, undefined, token);
    }
    if (memoryId1) {
      await del(`${MEMORIES_BASE}/${memoryId1}`, { reason: 'live-test-cleanup' }, token);
    }
    if (memoryId2) {
      await del(`${MEMORIES_BASE}/${memoryId2}`, { reason: 'live-test-cleanup' }, token);
    }
  });

  it('should create two prerequisite memories', async () => {
    const [res1, res2] = await Promise.all([
      post(MEMORIES_BASE, {
        content: 'Live test: dogs are loyal companions',
        type: 'fact',
        tags: ['live-test', 'animals'],
      }, token),
      post(MEMORIES_BASE, {
        content: 'Live test: cats are independent pets',
        type: 'fact',
        tags: ['live-test', 'animals'],
      }, token),
    ]);

    if (res1.status === 201 && res2.status === 201) {
      memoryId1 = res1.body.memory_id;
      memoryId2 = res2.body.memory_id;
    } else {
      console.warn(`Memory creation failed: ${res1.status}, ${res2.status}`);
    }
  });

  it('POST /relationships — create relationship', async () => {
    if (!memoryId1 || !memoryId2) return;

    const res = await post(REL_BASE, {
      memory_ids: [memoryId1, memoryId2],
      relationship_type: 'related',
      observation: 'Both are about common household pets',
    }, token);

    if (res.status === 201) {
      expect(res.body.relationship_id).toBeDefined();
      relationshipId = res.body.relationship_id;
    } else {
      console.warn(`Relationship creation returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /relationships/search — search relationships', async () => {
    if (!relationshipId) return;

    const res = await post(`${REL_BASE}/search`, {
      query: 'pets',
    }, token);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('relationships');
  });

  it('PATCH /relationships/:id — update relationship', async () => {
    if (!relationshipId) return;

    const res = await patch(`${REL_BASE}/${relationshipId}`, {
      observation: 'Updated: both are popular household pets',
      strength: 0.9,
    }, token);

    expect(res.status).toBe(200);
  });

  it('DELETE /relationships/:id — delete relationship', async () => {
    if (!relationshipId) return;

    const res = await del(`${REL_BASE}/${relationshipId}`, undefined, token);

    expect(res.status).toBe(200);
    relationshipId = null; // already cleaned up
  });
});
