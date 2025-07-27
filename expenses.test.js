const request = require('supertest');
const app = require('../app');

describe('Expenses Routes', () => {
  let agent = request.agent(app);
  let insertedExpenseId; 

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

  it('should add a new expense', async () => {
    const res = await agent
      .post('/expenses/add')
      .type('form')
      .send({
        amount: 123.45,
        category: 'Test Category',
        description: 'Test Expense',
        date: '2025-07-26'
      });

    expect([200, 302]).toContain(res.statusCode);
  });

  it('should reject adding expense with missing fields', async () => {
    const res = await agent
      .post('/expenses/add')
      .type('form')
      .send({
        amount: '',
        category: '',
        date: ''
      });

    expect(res.statusCode).toBe(302); 
  });

  it('should return expense summary JSON', async () => {
    const res = await agent.get('/expenses/summary');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

   
    if (res.body.length > 0) {
      insertedExpenseId = res.body[res.body.length - 1].id;
    }
  });

  it('should return filtered summary for valid month', async () => {
    const res = await agent.get('/expenses/filtered-summary?month=2025-07');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
  });

  it('should reject filtered summary for invalid month', async () => {
    const res = await agent.get('/expenses/filtered-summary?month=2025-99');
    expect(res.statusCode).toBe(400);
  });

  it('should edit an existing expense', async () => {
    if (!insertedExpenseId) return console.warn('⚠️ No expense ID found to edit.');

    const res = await agent
      .post('/expenses/edit')
      .type('form')
      .send({
        id: insertedExpenseId,
        amount: 200.0,
        category: 'Updated Category',
        date: '2025-07-27'
      });

    expect([200, 302]).toContain(res.statusCode);
  });

  it('should delete an expense by ID', async () => {
    if (!insertedExpenseId) return console.warn('⚠️ No expense ID found to delete.');

    const res = await agent.post(`/expenses/delete/${insertedExpenseId}`);
    expect([200, 302]).toContain(res.statusCode);
  });
});
