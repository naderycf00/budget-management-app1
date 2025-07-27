const request = require('supertest');
const app = require('../app');

describe('Budget Routes', () => {

  let agent = request.agent(app); 

  beforeAll(async () => {
    const res = await agent
      .post('/login')
      .type('form')
      .send({
        email: 'test5@mailtrap.io',
        password: '555'
      });

    expect([200, 302]).toContain(res.statusCode);
  });

  it('should insert a budget for a valid month', async () => {
    const res = await agent
      .post('/budget')
      .type('form')
      .send({
        month: '2025-07',
        amount: 400
      });

    expect([200, 302]).toContain(res.statusCode);
  });

  it('should reject invalid month format', async () => {
    const res = await agent
      .post('/budget')
      .type('form')
      .send({
        month: '2025-13',
        amount: 300
      });

    expect(res.statusCode).toBe(400);
  });

  it('should reject negative amount', async () => {
    const res = await agent
      .post('/budget')
      .type('form')
      .send({
        month: '2025-06',
        amount: -200
      });

    expect(res.statusCode).toBe(400);
  });

  it('should return budget for a specific month', async () => {
    const res = await agent
      .get('/budget/view')
      .query({ month: '2025-07' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('amount');
  });

  it('should update budget for a month', async () => {
    const res = await agent
      .post('/budget/update')
      .type('form')
      .send({
        month: '2025-07',
        amount: 600
      });

    expect([200, 302]).toContain(res.statusCode);
  });

  it('should delete a budget for a month', async () => {
    const res = await agent
      .post('/budget/delete/2025-07');

    expect([200, 302]).toContain(res.statusCode);
  });

});
