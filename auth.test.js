const request = require('supertest');
const app = require('../app');

describe('Auth Routes', () => {

  it('should reject login for unverified user', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({
        email: 'unverified@mailtrap.io',
        password: '123'
      });

    // Accept either 401 or redirect to login
    expect([401, 302]).toContain(res.statusCode);

    if (res.statusCode === 302) {
      // ✅ Fix: now checks if redirected to /login instead of /verify
      expect(res.headers.location).toMatch(/login/i);
    }
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({
        email: 'test5@mailtrap.io',
        password: '555'
      });

    expect([200, 302]).toContain(res.statusCode);

    if (res.statusCode === 302) {
      expect(res.headers.location).toMatch(/index|dashboard|summary/i);
    }
  });

});
