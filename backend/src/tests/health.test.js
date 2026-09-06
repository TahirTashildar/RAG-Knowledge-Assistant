const request = require('supertest');
const app = require('../app');

// NODE_ENV=test skips the required-env check on jwtSecret/mongodbUri so this
// runs without a real Mongo connection. Auth/document/conversation tests
// (Phase 16) will spin up mongodb-memory-server instead.
describe('GET /api/health', () => {
  it('returns success:true and a message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });
});
