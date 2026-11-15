import prisma from '../config/database';

export class ReportService {
  /**
   * Get dashboard summary statistics
   */
  static async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalReservations,
      confirmedReservations,
      checkedInReservations,
      todayArrivals,
      todayDepartures,
      totalRevenue,
      monthlyRevenue,
      recentReservations,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.room.count({ where: { status: 'OCCUPIED' } }),
      prisma.room.count({ where: { status: 'MAINTENANCE' } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'CONFIRMED' } }),
      prisma.reservation.count({ where: { status: 'CHECKED_IN' } }),
      prisma.reservation.count({
        where: {
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: 'CONFIRMED',
        },
      }),
      prisma.reservation.count({
        where: {
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: 'CHECKED_IN',
        },
      }),
      prisma.payment.aggregate({
        where: { paymentStatus: 'SUCCESS' },
        _sum: { amount: true },
      }),
      this.getMonthlyRevenue(),
      prisma.reservation.findMany({
        include: {
          room: { include: { roomType: { select: { name: true } } } },
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const occupancyRate = totalRooms > 0 
      ? Math.round((occupiedRooms / totalRooms) * 100) 
      : 0;

    return {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        maintenance: maintenanceRooms,
        occupancyRate,
      },
      reservations: {
        total: totalReservations,
        confirmed: confirmedReservations,
        checkedIn: checkedInReservations,
        todayArrivals,
        todayDepartures,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        monthly: monthlyRevenue,
      },
      recentReservations,
    };
  }

  /**
   * Get revenue report for a date range
   */
  static async getRevenueReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const payments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'SUCCESS',
        createdAt: { gte: start, lte: end },
      },
      include: {
        reservation: {
          select: {
            bookingReference: true,
            checkInDate: true,
            checkOutDate: true,
            numberOfNights: true,
            room: { select: { roomNumber: true, roomType: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const refundedPayments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'REFUNDED',
        createdAt: { gte: start, lte: end },
      },
    });
    const totalRefunds = refundedPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalRevenue,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      totalTransactions: payments.length,
      payments,
    };
  }

  /**
   * Get occupancy report for a date range
   */
  static async getOccupancyReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalRooms = await prisma.room.count({
      where: { status: { notIn: ['INACTIVE'] } },
    });

    // Get reservations that overlap with the date range
    const reservations = await prisma.reservation.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
        checkInDate: { lt: end },
        checkOutDate: { gt: start },
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
        roomId: true,
        status: true,
      },
    });

    // Calculate daily occupancy
    const dailyOccupancy: Array<{ date: string; occupied: number; total: number; rate: number }> = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const occupiedRooms = new Set(
        reservations
          .filter(r => r.checkInDate < dayEnd && r.checkOutDate > dayStart)
          .map(r => r.roomId)
      ).size;

      dailyOccupancy.push({
        date: current.toISOString().split('T')[0],
        occupied: occupiedRooms,
        total: totalRooms,
        rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      });

      current.setDate(current.getDate() + 1);
    }

    const avgOccupancy = dailyOccupancy.length > 0
      ? Math.round(dailyOccupancy.reduce((sum, d) => sum + d.rate, 0) / dailyOccupancy.length)
      : 0;

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalRooms,
      averageOccupancy: avgOccupancy,
      dailyOccupancy,
    };
  }

  /**
   * Helper: get monthly revenue for the past 12 months
   */
  private static async getMonthlyRevenue() {
    const months: Array<{ month: string; revenue: number }> = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const result = await prisma.payment.aggregate({
        where: {
          paymentStatus: 'SUCCESS',
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      });

      months.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: result._sum.amount || 0,
      });
    }

    return months;
  }
}
