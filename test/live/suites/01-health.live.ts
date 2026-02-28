import { get } from '../helpers/http-client.js';

describe('Health (live)', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /version returns 200 with version', async () => {
    const res = await get('/version');
    expect(res.status).toBe(200);
    expect(res.body.version).toBe('0.1.0');
  });
});
