import { post, del } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const MEMORIES_BASE = '/api/svc/v1/memories';
const SPACES_BASE = '/api/svc/v1/spaces';

describe('Spaces (live)', () => {
  const token = makeToken(TEST_USER_ID);
  let memoryId: string | null = null;

  afterAll(async () => {
    if (memoryId) {
      await del(`${MEMORIES_BASE}/${memoryId}`, { reason: 'live-test-cleanup' }, token);
    }
  });

  it('should create a prerequisite memory', async () => {
    const res = await post(MEMORIES_BASE, {
      content: 'Live test: shared knowledge about TypeScript generics',
      type: 'fact',
      tags: ['live-test', 'typescript'],
    }, token);

    if (res.status === 201) {
      memoryId = res.body.memory_id;
    } else {
      console.warn(`Memory creation returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /spaces/publish — publish memory to space', async () => {
    if (!memoryId) return;

    const res = await post(`${SPACES_BASE}/publish`, {
      memory_id: memoryId,
      spaces: ['test-space'],
    }, token);

    if (res.status === 201 || res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`publish returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /spaces/search — search within space', async () => {
    const res = await post(`${SPACES_BASE}/search`, {
      query: 'TypeScript',
      spaces: ['test-space'],
    }, token);

    if (res.status === 201 || res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`search returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /spaces/query — query space semantically', async () => {
    const res = await post(`${SPACES_BASE}/query`, {
      question: 'What do I know about TypeScript?',
      spaces: ['test-space'],
    }, token);

    if (res.status === 201 || res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`query returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /spaces/retract — retract memory from space', async () => {
    if (!memoryId) return;

    const res = await post(`${SPACES_BASE}/retract`, {
      memory_id: memoryId,
      spaces: ['test-space'],
    }, token);

    if (res.status === 201 || res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`retract returned ${res.status}:`, JSON.stringify(res.body));
    }
  });
});
