import { Request, Response, NextFunction } from 'express';
import { ReservationService } from '../services/reservation.service';

export class StaffController {
  static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await ReservationService.checkIn(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const reservation = await ReservationService.checkOut(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: reservation });
    } catch (error) {
      next(error);
    }
  }

  static async getArrivals(req: Request, res: Response, next: NextFunction) {
    try {
      const arrivals = await ReservationService.getArrivals(req.query.date as string);
      res.json({ success: true, data: arrivals });
    } catch (error) {
      next(error);
    }
  }

  static async getDepartures(req: Request, res: Response, next: NextFunction) {
    try {
      const departures = await ReservationService.getDepartures(req.query.date as string);
      res.json({ success: true, data: departures });
    } catch (error) {
      next(error);
    }
  }
}
