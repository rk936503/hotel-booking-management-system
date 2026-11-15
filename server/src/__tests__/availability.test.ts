import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('3. Availability Search Engine Tests', () => {
  it('3.1 should return available rooms for valid future date range', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 33);

    const res = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Verify room shape
    const room = res.body.data[0];
    expect(room.roomNumber).toBeDefined();
    expect(room.roomType).toBeDefined();
    expect(room.roomType.basePrice).toBeGreaterThan(0);
  });

  it('3.2 should reject search with check-in date in the past (400 Bad Request)', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: '2020-01-01',
        checkOutDate: '2020-01-05',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('3.3 should reject search when check-out date is before or equal to check-in (400)', async () => {
    const res = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: '2026-12-10',
        checkOutDate: '2026-12-05', // Before check-in
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    const sameDateRes = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: '2026-12-10',
        checkOutDate: '2026-12-10', // Same day
      });

    expect(sameDateRes.status).toBe(400);
  });

  it('3.4 should filter rooms by guest capacity', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 40);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 42);

    const res = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
        guests: 4, // Needs capacity >= 4
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // All returned rooms must have capacity >= 4
    for (const room of res.body.data) {
      expect(room.roomType.capacity).toBeGreaterThanOrEqual(4);
    }
  });

  it('3.5 should never return rooms currently under MAINTENANCE', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 50);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 52);

    const res = await request(app)
      .get('/api/availability')
      .query({
        checkInDate: checkIn.toISOString().split('T')[0],
        checkOutDate: checkOut.toISOString().split('T')[0],
      });

    expect(res.status).toBe(200);
    for (const room of res.body.data) {
      expect(room.status).not.toBe('MAINTENANCE');
      expect(room.status).not.toBe('INACTIVE');
    }
  });
});
