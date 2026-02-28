import { post } from '../helpers/http-client.js';
import { makeToken, makeExpiredToken, makeWrongAudienceToken } from '../helpers/jwt.js';
import { TEST_USER_ID } from '../helpers/test-ids.js';

const PROTECTED_PATH = '/api/svc/v1/memories/search';
const VALID_BODY = { query: 'test' };

describe('Auth (live)', () => {
  it('should reject request with no Authorization header', async () => {
    const res = await post(PROTECTED_PATH, VALID_BODY);
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Missing Authorization');
  });

  it('should reject request with invalid token', async () => {
    const res = await post(PROTECTED_PATH, VALID_BODY, 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('should reject request with expired token', async () => {
    const token = makeExpiredToken(TEST_USER_ID);
    const res = await post(PROTECTED_PATH, VALID_BODY, token);
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('expired');
  });

  it('should reject request with wrong audience', async () => {
    const token = makeWrongAudienceToken(TEST_USER_ID);
    const res = await post(PROTECTED_PATH, VALID_BODY, token);
    expect(res.status).toBe(401);
  });

  it('should pass auth with valid token', async () => {
    const token = makeToken(TEST_USER_ID);
    const res = await post(PROTECTED_PATH, VALID_BODY, token);
    // Auth passes — endpoint may return any non-401 status
    expect(res.status).not.toBe(401);
  });
});
