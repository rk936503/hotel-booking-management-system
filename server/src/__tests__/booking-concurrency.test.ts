import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import prisma from '../config/database';

describe('4. Reservation Lifecycle, Concurrency & Double-Booking Protection', () => {
  let guestToken1 = '';
  let guestToken2 = '';
  let testRoom: any;

  beforeAll(async () => {
    // Login Guest 1
    const g1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest1@example.com', password: 'Password123!' });
    guestToken1 = g1.body.data.token;

    // Login Guest 2
    const g2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest2@example.com', password: 'Password123!' });
    guestToken2 = g2.body.data.token;

    // Find an available room
    testRoom = await prisma.room.findFirst({
      where: { status: 'AVAILABLE', roomNumber: '204' },
      include: { roomType: true },
    });

    // Clean up any test holds/reservations on this room for test date range to ensure repeatability
    await prisma.payment.deleteMany({
      where: { reservation: { roomId: testRoom.id, checkInDate: { gte: new Date('2026-11-20') } } },
    });
    await prisma.reservation.deleteMany({
      where: { roomId: testRoom.id, checkInDate: { gte: new Date('2026-11-20') } },
    });
    await prisma.bookingHold.deleteMany({
      where: { roomId: testRoom.id, checkInDate: { gte: new Date('2026-11-20') } },
    });
  });

  it('4.1 should create a temporary booking hold with itemized pricing', async () => {
    const checkIn = '2026-12-01';
    const checkOut = '2026-12-04'; // 3 nights

    const res = await request(app)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hold.status).toBe('ACTIVE');
    expect(res.body.data.pricing.numberOfNights).toBe(3);
    expect(res.body.data.pricing.subtotal).toBeCloseTo(testRoom.roomType.basePrice * 3, 2);
    expect(res.body.data.pricing.totalAmount).toBeGreaterThan(res.body.data.pricing.subtotal);
  });

  it('4.2 should prevent a second guest from holding the same room for overlapping dates (Conflict 409)', async () => {
    const overlappingCheckIn = '2026-12-02';
    const overlappingCheckOut = '2026-12-05';

    const res = await request(app)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${guestToken2}`)
      .send({
        roomId: testRoom.id,
        checkInDate: overlappingCheckIn,
        checkOutDate: overlappingCheckOut,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('4.3 should complete reservation and confirm on simulated payment', async () => {
    const checkIn = '2026-12-10';
    const checkOut = '2026-12-13';

    // 1. Hold
    const holdRes = await request(app)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });
    expect(holdRes.status).toBe(201);
    const holdId = holdRes.body.data.hold.id;

    // 2. Create Reservation
    const resRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 1,
        holdId,
      });
    expect(resRes.status).toBe(201);
    expect(resRes.body.data.status).toBe('PENDING');
    expect(resRes.body.data.bookingReference).toMatch(/^HB-\d{8}-[A-Z0-9]{4}$/);
    const reservationId = resRes.body.data.id;

    // 3. Simulate Payment
    const payRes = await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({
        reservationId,
        paymentMethod: 'CREDIT_CARD',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.paymentStatus).toBe('SUCCESS');
    expect(payRes.body.data.reservation.status).toBe('CONFIRMED');

    // 4. Overlapping booking by Guest 2 on confirmed room must be rejected
    const overlapRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${guestToken2}`)
      .send({
        roomId: testRoom.id,
        checkInDate: '2026-12-11',
        checkOutDate: '2026-12-14',
        numberOfGuests: 1,
      });

    expect(overlapRes.status).toBe(409);
  });

  it('4.4 should handle simultaneous concurrent requests: exactly one succeeds', async () => {
    const checkIn = '2026-12-20';
    const checkOut = '2026-12-23';

    // Launch two simultaneous hold requests for the exact same room & dates
    const [req1, req2] = await Promise.all([
      request(app)
        .post('/api/reservations/holds')
        .set('Authorization', `Bearer ${guestToken1}`)
        .send({ roomId: testRoom.id, checkInDate: checkIn, checkOutDate: checkOut }),
      request(app)
        .post('/api/reservations/holds')
        .set('Authorization', `Bearer ${guestToken2}`)
        .send({ roomId: testRoom.id, checkInDate: checkIn, checkOutDate: checkOut }),
    ]);

    const statuses = [req1.status, req2.status];
    expect(statuses).toContain(201); // Exactly one got hold
    expect(statuses).toContain(409); // Exactly one was rejected with Conflict
  });

  it('4.5 should allow half-open date booking: check out day equals next check in day', async () => {
    // Room is confirmed 2026-12-10 to 2026-12-13 from test 4.3
    // A booking starting 2026-12-13 to 2026-12-16 should be ALLOWED
    const res = await request(app)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${guestToken2}`)
      .send({
        roomId: testRoom.id,
        checkInDate: '2026-12-13', // Check in on previous checkout date
        checkOutDate: '2026-12-16',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('4.6 should allow cancellation and release dates for future bookings', async () => {
    const checkIn = '2026-12-26';
    const checkOut = '2026-12-28';

    // 1. Create and confirm reservation
    const resRes = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: 1,
      });
    const reservationId = resRes.body.data.id;

    await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${guestToken1}`)
      .send({ reservationId, paymentMethod: 'UPI' });

    // 2. Cancel reservation
    const cancelRes = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${guestToken1}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // 3. Now Guest 2 should be able to book those exact dates
    const rebookRes = await request(app)
      .post('/api/reservations/holds')
      .set('Authorization', `Bearer ${guestToken2}`)
      .send({
        roomId: testRoom.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      });

    expect(rebookRes.status).toBe(201);
    expect(rebookRes.body.success).toBe(true);
  });
});
