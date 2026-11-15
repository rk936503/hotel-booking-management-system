import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../services/availability.service';

export class AvailabilityController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await AvailabilityService.searchAvailability(req.query as any);
      res.json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }
}
