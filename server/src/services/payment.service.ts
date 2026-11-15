import prisma from '../config/database';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { generateTransactionReference } from '../utils/helpers';
import { AuditService } from './audit.service';

export class PaymentService {
  /**
   * Simulate a payment for a reservation.
   * In production, this would integrate with a payment gateway.
   * For demo purposes, payments always succeed unless explicitly testing failure.
   */
  static async simulatePayment(data: {
    reservationId: string;
    paymentMethod: string;
    userId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: data.reservationId },
        include: { payments: true },
      });

      if (!reservation) {
        throw new NotFoundError('Reservation not found');
      }

      if (reservation.userId !== data.userId) {
        throw new NotFoundError('Reservation not found');
      }

      if (reservation.status !== 'PENDING') {
        throw new BadRequestError(`Cannot process payment for reservation with status: ${reservation.status}`);
      }

      // Check for existing successful payment (idempotency)
      const existingPayment = reservation.payments.find(p => p.paymentStatus === 'SUCCESS');
      if (existingPayment) {
        // Already paid - return the existing payment (idempotent)
        return {
          payment: existingPayment,
          reservation: await tx.reservation.findUnique({
            where: { id: data.reservationId },
            include: {
              room: { include: { roomType: true } },
              user: { select: { id: true, fullName: true, email: true } },
              payments: true,
            },
          }),
        };
      }

      // Simulate payment processing (always succeeds for demo)
      const transactionReference = generateTransactionReference();

      const payment = await tx.payment.create({
        data: {
          reservationId: data.reservationId,
          amount: reservation.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'SUCCESS',
          transactionReference,
        },
      });

      // Confirm the reservation upon successful payment
      const updatedReservation = await tx.reservation.update({
        where: { id: data.reservationId },
        data: { status: 'CONFIRMED' },
        include: {
          room: { include: { roomType: true } },
          user: { select: { id: true, fullName: true, email: true } },
          payments: true,
        },
      });

      await AuditService.log({
        userId: data.userId,
        action: 'PAYMENT_PROCESSED',
        entityType: 'Payment',
        entityId: payment.id,
        newValue: {
          reservationId: data.reservationId,
          amount: payment.amount,
          method: payment.paymentMethod,
          status: payment.paymentStatus,
          transactionReference,
        },
      });

      await AuditService.log({
        userId: data.userId,
        action: 'RESERVATION_CONFIRMED',
        entityType: 'Reservation',
        entityId: data.reservationId,
        oldValue: { status: 'PENDING' },
        newValue: { status: 'CONFIRMED' },
      });

      return { payment, reservation: updatedReservation };
    });
  }

  static async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        reservation: {
          include: {
            room: { include: { roomType: true } },
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  static async getPaymentsByReservation(reservationId: string) {
    return prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
