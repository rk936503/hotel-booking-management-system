import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service';

export class RoomController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.getAll(req.query as any);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.getById(req.params.id as string);
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.create(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.update(req.params.id as string, req.body, req.user!.userId);
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.delete(req.params.id as string, req.user!.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
