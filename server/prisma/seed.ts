import { PrismaClient, UserRole, RoomStatus, ReservationStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingHold.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Create Users
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin User',
      email: 'admin@hotel.com',
      passwordHash,
      phone: '+1-555-0100',
      role: UserRole.ADMIN,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      fullName: 'Sarah Johnson',
      email: 'staff1@hotel.com',
      passwordHash,
      phone: '+1-555-0201',
      role: UserRole.STAFF,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      fullName: 'Michael Brown',
      email: 'staff2@hotel.com',
      passwordHash,
      phone: '+1-555-0202',
      role: UserRole.STAFF,
    },
  });

  const guest1 = await prisma.user.create({
    data: {
      fullName: 'John Smith',
      email: 'guest1@example.com',
      passwordHash,
      phone: '+1-555-0301',
      role: UserRole.GUEST,
    },
  });

  const guest2 = await prisma.user.create({
    data: {
      fullName: 'Emily Davis',
      email: 'guest2@example.com',
      passwordHash,
      phone: '+1-555-0302',
      role: UserRole.GUEST,
    },
  });

  const guest3 = await prisma.user.create({
    data: {
      fullName: 'Robert Wilson',
      email: 'guest3@example.com',
      passwordHash,
      phone: '+1-555-0303',
      role: UserRole.GUEST,
    },
  });

  console.log('✅ Users created');

  // Create Room Types
  const roomTypes = await Promise.all([
    prisma.roomType.create({
      data: {
        name: 'Standard Single',
        description: 'Comfortable single room with modern amenities, perfect for solo travelers. Features a queen-size bed, work desk, and city view.',
        basePrice: 2500.00,
        capacity: 1,
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Work Desk', 'Room Service'],
        imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Standard Double',
        description: 'Spacious double room ideal for couples or guests who prefer extra space. Features a king-size bed, sitting area, and garden view.',
        basePrice: 4000.00,
        capacity: 2,
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Room Service', 'Safe'],
        imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Deluxe Suite',
        description: 'Luxurious suite with separate living area, premium furnishings, and panoramic views. Perfect for business travelers and special occasions.',
        basePrice: 6500.00,
        capacity: 3,
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Room Service', 'Safe', 'Bathrobe', 'Balcony', 'Living Area'],
        imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Family Room',
        description: 'Large family-friendly room with two double beds, children\'s amenities, and connecting door option. Great for families with kids.',
        basePrice: 5500.00,
        capacity: 4,
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Room Service', 'Safe', 'Extra Beds Available', 'Kids Welcome Pack'],
        imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
      },
    }),
    prisma.roomType.create({
      data: {
        name: 'Presidential Suite',
        description: 'The finest accommodation featuring a master bedroom, full living room, dining area, private bar, and executive workspace. Includes butler service.',
        basePrice: 15000.00,
        capacity: 4,
        amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Mini Bar', 'Coffee Maker', 'Room Service', 'Safe', 'Bathrobe', 'Balcony', 'Living Area', 'Dining Area', 'Butler Service', 'Jacuzzi', 'Private Bar'],
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
      },
    }),
  ]);

  console.log('✅ Room types created');

  // Create Rooms
  const rooms = await Promise.all([
    // Standard Single - 4 rooms
    prisma.room.create({ data: { roomNumber: '101', roomTypeId: roomTypes[0].id, floor: 1, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '102', roomTypeId: roomTypes[0].id, floor: 1, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '201', roomTypeId: roomTypes[0].id, floor: 2, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '202', roomTypeId: roomTypes[0].id, floor: 2, status: RoomStatus.MAINTENANCE } }),

    // Standard Double - 4 rooms
    prisma.room.create({ data: { roomNumber: '103', roomTypeId: roomTypes[1].id, floor: 1, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '104', roomTypeId: roomTypes[1].id, floor: 1, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '203', roomTypeId: roomTypes[1].id, floor: 2, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '204', roomTypeId: roomTypes[1].id, floor: 2, status: RoomStatus.AVAILABLE } }),

    // Deluxe Suite - 3 rooms
    prisma.room.create({ data: { roomNumber: '301', roomTypeId: roomTypes[2].id, floor: 3, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '302', roomTypeId: roomTypes[2].id, floor: 3, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '303', roomTypeId: roomTypes[2].id, floor: 3, status: RoomStatus.AVAILABLE } }),

    // Family Room - 2 rooms
    prisma.room.create({ data: { roomNumber: '401', roomTypeId: roomTypes[3].id, floor: 4, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '402', roomTypeId: roomTypes[3].id, floor: 4, status: RoomStatus.AVAILABLE } }),

    // Presidential Suite - 2 rooms
    prisma.room.create({ data: { roomNumber: '501', roomTypeId: roomTypes[4].id, floor: 5, status: RoomStatus.AVAILABLE } }),
    prisma.room.create({ data: { roomNumber: '502', roomTypeId: roomTypes[4].id, floor: 5, status: RoomStatus.AVAILABLE } }),
  ]);

  console.log('✅ Rooms created (15 rooms)');

  // Create sample reservations
  const now = new Date();

  // Past completed reservation
  const pastCheckIn = new Date(now);
  pastCheckIn.setDate(pastCheckIn.getDate() - 10);
  const pastCheckOut = new Date(now);
  pastCheckOut.setDate(pastCheckOut.getDate() - 7);

  const reservation1 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0001',
      userId: guest1.id,
      roomId: rooms[4].id, // Room 103 (Standard Double: 4000)
      checkInDate: pastCheckIn,
      checkOutDate: pastCheckOut,
      numberOfGuests: 2,
      numberOfNights: 3,
      roomPrice: 4000.00,
      subtotal: 12000.00,
      taxAmount: 1440.00,
      totalAmount: 13440.00,
      status: ReservationStatus.CHECKED_OUT,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation1.id,
      amount: 13440.00,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: PaymentStatus.SUCCESS,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  // Another past completed reservation
  const pastCheckIn2 = new Date(now);
  pastCheckIn2.setDate(pastCheckIn2.getDate() - 5);
  const pastCheckOut2 = new Date(now);
  pastCheckOut2.setDate(pastCheckOut2.getDate() - 3);

  const reservation2 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0002',
      userId: guest2.id,
      roomId: rooms[8].id, // Room 301 (Deluxe Suite: 6500)
      checkInDate: pastCheckIn2,
      checkOutDate: pastCheckOut2,
      numberOfGuests: 2,
      numberOfNights: 2,
      roomPrice: 6500.00,
      subtotal: 13000.00,
      taxAmount: 1560.00,
      totalAmount: 14560.00,
      status: ReservationStatus.CHECKED_OUT,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation2.id,
      amount: 14560.00,
      paymentMethod: 'DEBIT_CARD',
      paymentStatus: PaymentStatus.SUCCESS,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  // Current active reservation (CHECKED_IN)
  const currentCheckIn = new Date(now);
  currentCheckIn.setDate(currentCheckIn.getDate() - 1);
  const currentCheckOut = new Date(now);
  currentCheckOut.setDate(currentCheckOut.getDate() + 2);

  const reservation3 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0003',
      userId: guest1.id,
      roomId: rooms[0].id, // Room 101 (Standard Single: 2500)
      checkInDate: currentCheckIn,
      checkOutDate: currentCheckOut,
      numberOfGuests: 1,
      numberOfNights: 3,
      roomPrice: 2500.00,
      subtotal: 7500.00,
      taxAmount: 900.00,
      totalAmount: 8400.00,
      status: ReservationStatus.CHECKED_IN,
    },
  });

  // Set room 101 to OCCUPIED
  await prisma.room.update({
    where: { id: rooms[0].id },
    data: { status: RoomStatus.OCCUPIED },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation3.id,
      amount: 8400.00,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: PaymentStatus.SUCCESS,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  // Upcoming confirmed reservation
  const futureCheckIn = new Date(now);
  futureCheckIn.setDate(futureCheckIn.getDate() + 3);
  const futureCheckOut = new Date(now);
  futureCheckOut.setDate(futureCheckOut.getDate() + 6);

  const reservation4 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0004',
      userId: guest3.id,
      roomId: rooms[5].id, // Room 104 (Standard Double: 4000)
      checkInDate: futureCheckIn,
      checkOutDate: futureCheckOut,
      numberOfGuests: 2,
      numberOfNights: 3,
      roomPrice: 4000.00,
      subtotal: 12000.00,
      taxAmount: 1440.00,
      totalAmount: 13440.00,
      status: ReservationStatus.CONFIRMED,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation4.id,
      amount: 13440.00,
      paymentMethod: 'NET_BANKING',
      paymentStatus: PaymentStatus.SUCCESS,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  // Cancelled reservation
  const cancelledCheckIn = new Date(now);
  cancelledCheckIn.setDate(cancelledCheckIn.getDate() + 5);
  const cancelledCheckOut = new Date(now);
  cancelledCheckOut.setDate(cancelledCheckOut.getDate() + 7);

  const reservation5 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0005',
      userId: guest2.id,
      roomId: rooms[11].id, // Room 401 (Family Room: 5500)
      checkInDate: cancelledCheckIn,
      checkOutDate: cancelledCheckOut,
      numberOfGuests: 3,
      numberOfNights: 2,
      roomPrice: 5500.00,
      subtotal: 11000.00,
      taxAmount: 1320.00,
      totalAmount: 12320.00,
      status: ReservationStatus.CANCELLED,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation5.id,
      amount: 12320.00,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: PaymentStatus.REFUNDED,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  // Today's arrival
  const todayArrivalCheckIn = new Date(now);
  todayArrivalCheckIn.setHours(14, 0, 0, 0);
  const todayArrivalCheckOut = new Date(now);
  todayArrivalCheckOut.setDate(todayArrivalCheckOut.getDate() + 3);

  const reservation6 = await prisma.reservation.create({
    data: {
      bookingReference: 'HB-SEED-0006',
      userId: guest2.id,
      roomId: rooms[9].id, // Room 302 (Deluxe Suite: 6500)
      checkInDate: todayArrivalCheckIn,
      checkOutDate: todayArrivalCheckOut,
      numberOfGuests: 2,
      numberOfNights: 3,
      roomPrice: 6500.00,
      subtotal: 19500.00,
      taxAmount: 2340.00,
      totalAmount: 21840.00,
      status: ReservationStatus.CONFIRMED,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId: reservation6.id,
      amount: 21840.00,
      paymentMethod: 'UPI',
      paymentStatus: PaymentStatus.SUCCESS,
      transactionReference: `TXN-SEED-${uuidv4().slice(0, 8)}`,
    },
  });

  console.log('✅ Reservations and payments created');

  // Create some audit logs
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'USER_REGISTERED', entityType: 'User', entityId: admin.id, newValue: JSON.stringify({ role: 'ADMIN' }) },
      { userId: guest1.id, action: 'RESERVATION_CREATED', entityType: 'Reservation', entityId: reservation1.id, newValue: JSON.stringify({ bookingReference: 'HB-SEED-0001' }) },
      { userId: guest1.id, action: 'PAYMENT_PROCESSED', entityType: 'Payment', entityId: reservation1.id, newValue: JSON.stringify({ amount: 13440.00 }) },
      { userId: staff1.id, action: 'GUEST_CHECKED_IN', entityType: 'Reservation', entityId: reservation3.id, newValue: JSON.stringify({ status: 'CHECKED_IN' }) },
      { userId: guest2.id, action: 'RESERVATION_CANCELLED', entityType: 'Reservation', entityId: reservation5.id, oldValue: JSON.stringify({ status: 'CONFIRMED' }), newValue: JSON.stringify({ status: 'CANCELLED' }) },
    ],
  });

  console.log('✅ Audit logs created');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Demo Credentials:');
  console.log('   Admin: admin@hotel.com / Password123!');
  console.log('   Staff: staff1@hotel.com / Password123!');
  console.log('   Staff: staff2@hotel.com / Password123!');
  console.log('   Guest: guest1@example.com / Password123!');
  console.log('   Guest: guest2@example.com / Password123!');
  console.log('   Guest: guest3@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
