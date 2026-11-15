import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('5. Staff Operations & Admin Reporting Tests', () => {
  let staffToken = '';
  let adminToken = '';
  let guestToken = '';
  let testRoom: any;
  let testReservationId = '';

  beforeAll(async () => {
    // Login Staff
    const s = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff1@hotel.com', password: 'Password123!' });
    staffToken = s.body.data.token;

    // Login Admin
    const a = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hotel.com', password: 'Password123!' });
    adminToken = a.body.data.token;

    // Login Guest
    const g = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest3@example.com', password: 'Password123!' });
    guestToken = g.body.data.token;

    // Pick room 303 for testing operations
    testRoom = await prisma.room.findFirst({
      where: { roomNumber: '303' },
    });

    // Create a confirmed reservation for operations test
    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        numberOfGuests: 2,
      });
    testReservationId = res.body.data.id;

    // Confirm it via payment
    await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ reservationId: testReservationId, paymentMethod: 'NET_BANKING' });
  });

  it('5.1 Staff check-in should transition CONFIRMED -> CHECKED_IN and update room to OCCUPIED', async () => {
    const res = await request(app)
      .patch(`/api/staff/reservations/${testReservationId}/check-in`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CHECKED_IN');

    // Verify room status in DB
    const roomInDb = await prisma.room.findUnique({ where: { id: testRoom.id } });
    expect(roomInDb?.status).toBe('OCCUPIED');
  });

  it('5.2 Staff check-out should transition CHECKED_IN -> CHECKED_OUT and update room to AVAILABLE', async () => {
    const res = await request(app)
      .patch(`/api/staff/reservations/${testReservationId}/check-out`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CHECKED_OUT');

    // Verify room status in DB is restored to AVAILABLE
    const roomInDb = await prisma.room.findUnique({ where: { id: testRoom.id } });
    expect(roomInDb?.status).toBe('AVAILABLE');
  });

  it('5.3 Should reject invalid state transition (cannot check out an already checked-out stay)', async () => {
    const res = await request(app)
      .patch(`/api/staff/reservations/${testReservationId}/check-out`)
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('5.4 Admin dashboard metrics should match underlying reservation & payment records', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const stats = res.body.data;

    // Room inventory count must match DB
    const actualRoomCount = await prisma.room.count();
    expect(stats.rooms.total).toBe(actualRoomCount);

    // Confirmed count must match DB
    const actualConfirmed = await prisma.reservation.count({ where: { status: 'CONFIRMED' } });
    expect(stats.reservations.confirmed).toBe(actualConfirmed);

    // Revenue must match sum of SUCCESS payments
    const paymentsSum = await prisma.payment.aggregate({
      where: { paymentStatus: 'SUCCESS' },
      _sum: { amount: true },
    });
    expect(stats.revenue.total).toBeCloseTo(paymentsSum._sum.amount || 0, 2);
  });

  it('5.5 Revenue report must return correct net revenue (Total minus Refunds)', async () => {
    const res = await request(app)
      .get('/api/admin/reports/revenue')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalRevenue).toBeGreaterThan(0);
    expect(res.body.data.netRevenue).toBe(
      res.body.data.totalRevenue - res.body.data.totalRefunds
    );
  });

  it('5.6 Occupancy report must calculate daily occupancy accurately', async () => {
    const res = await request(app)
      .get('/api/admin/reports/occupancy')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.dailyOccupancy)).toBe(true);
    expect(res.body.data.totalRooms).toBeGreaterThan(0);
  });
});
