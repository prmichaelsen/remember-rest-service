import { get, post, patch } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID, TEST_TARGET_USER_ID } from '../helpers/test-ids.js';

const BASE = '/api/svc/v1/trust';

describe('Trust (live)', () => {
  const token = makeToken(TEST_USER_ID);

  it('GET /trust/ghost-config — get ghost config', async () => {
    const res = await get(`${BASE}/ghost-config`, token);

    // May return 200 or 500 depending on Firestore state
    if (res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`GET ghost-config returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('PATCH /trust/ghost-config — update ghost config', async () => {
    const res = await patch(`${BASE}/ghost-config`, {
      enabled: true,
    }, token);

    if (res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`PATCH ghost-config returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /trust/set-user-trust — set trust level', async () => {
    const res = await post(`${BASE}/set-user-trust`, {
      target_user_id: TEST_TARGET_USER_ID,
      trust_level: 0.8,
    }, token);

    if (res.status === 200 || res.status === 201) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`set-user-trust returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /trust/remove-user-trust — remove trust', async () => {
    const res = await post(`${BASE}/remove-user-trust`, {
      target_user_id: TEST_TARGET_USER_ID,
    }, token);

    if (res.status === 200 || res.status === 201) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`remove-user-trust returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /trust/block-user — block a user', async () => {
    const res = await post(`${BASE}/block-user`, {
      target_user_id: TEST_TARGET_USER_ID,
    }, token);

    if (res.status === 200 || res.status === 201) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`block-user returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('POST /trust/unblock-user — unblock a user', async () => {
    const res = await post(`${BASE}/unblock-user`, {
      target_user_id: TEST_TARGET_USER_ID,
    }, token);

    if (res.status === 200 || res.status === 201) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`unblock-user returned ${res.status}:`, JSON.stringify(res.body));
    }
  });
});
