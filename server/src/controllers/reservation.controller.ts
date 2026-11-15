import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservation.service';

export class ReservationController {
  static async createHold(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReservationService.createHold({
        ...req.body,
        userId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await ReservationService.createReservation({
        ...req.body,
        userId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await ReservationService.getReservations({
        userId: req.user!.role === 'GUEST' ? req.user!.userId : undefined,
        status: req.query.status as string,
        page,
        limit,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.role === 'GUEST' ? req.user!.userId : undefined;
      const reservation = await ReservationService.getById(req.params.id as string, userId);
      res.json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaffOrAdmin = req.user!.role === 'STAFF' || req.user!.role === 'ADMIN';
      const reservation = await ReservationService.cancelReservation(
        req.params.id as string,
        req.user!.userId,
        isStaffOrAdmin
      );
      res.json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }
}
