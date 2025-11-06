import request from 'supertest';
import app from '../app.js';

describe('GET /health', () => {
  it('returns a healthy status payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
