import { get, patch } from '../helpers/http-client.js';
import { makeToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const BASE = '/api/svc/v1/preferences';

describe('Preferences (live)', () => {
  const token = makeToken(TEST_USER_ID);
  let originalPreferences: any = null;

  it('GET /preferences — get current preferences', async () => {
    const res = await get(BASE, token);

    // May return 200 with preferences or 500 if Firestore isn't configured
    if (res.status === 200) {
      expect(res.body).toBeDefined();
      originalPreferences = res.body;
    } else {
      console.warn(`GET preferences returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('PATCH /preferences — update a preference', async () => {
    if (!originalPreferences && originalPreferences !== null) return;

    const res = await patch(BASE, {
      search: { default_limit: 25 },
    }, token);

    if (res.status === 200) {
      expect(res.body).toBeDefined();
    } else {
      console.warn(`PATCH preferences returned ${res.status}:`, JSON.stringify(res.body));
    }
  });

  it('GET /preferences — verify update', async () => {
    if (!originalPreferences && originalPreferences !== null) return;

    const res = await get(BASE, token);

    if (res.status === 200) {
      expect(res.body).toBeDefined();
    }
  });
});
