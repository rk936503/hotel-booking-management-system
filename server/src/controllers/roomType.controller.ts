import { Request, Response, NextFunction } from 'express';
import { RoomTypeService } from '../services/roomType.service';

export class RoomTypeController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const roomTypes = await RoomTypeService.getAll();
      res.json({ success: true, data: roomTypes });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const roomType = await RoomTypeService.getById(req.params.id as string);
      res.json({ success: true, data: roomType });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const roomType = await RoomTypeService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: roomType });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const roomType = await RoomTypeService.update(req.params.id as string, req.body, req.user!.userId);
      res.json({ success: true, data: roomType });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoomTypeService.delete(req.params.id as string, req.user!.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
