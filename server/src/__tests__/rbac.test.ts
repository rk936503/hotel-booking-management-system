import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('2. Role-Based Access Control (RBAC) Tests', () => {
  let guestToken = '';
  let staffToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // Login Guest
    const guestRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest1@example.com', password: 'Password123!' });
    guestToken = guestRes.body.data.token;

    // Login Staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff1@hotel.com', password: 'Password123!' });
    staffToken = staffRes.body.data.token;

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hotel.com', password: 'Password123!' });
    adminToken = adminRes.body.data.token;
  });

  it('2.1 Guest CANNOT access admin dashboard (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('2.2 Guest CANNOT access staff arrivals list (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/staff/arrivals')
      .set('Authorization', `Bearer ${guestToken}`);

    expect(res.status).toBe(403);
  });

  it('2.3 Guest CANNOT create a new room (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ roomNumber: '999', roomTypeId: 'any', floor: 9 });

    expect(res.status).toBe(403);
  });

  it('2.4 Staff CAN access staff arrivals list (200 OK)', async () => {
    const res = await request(app)
      .get('/api/staff/arrivals')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('2.5 Staff CANNOT access admin user management (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });

  it('2.6 Admin CAN access admin dashboard (200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms).toBeDefined();
    expect(res.body.data.revenue).toBeDefined();
  });

  it('2.7 Admin CAN access admin user directory (200 OK)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
