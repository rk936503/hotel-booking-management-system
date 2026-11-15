import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import prisma from '../config/database';

export class AdminController {
  static async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ReportService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getRevenueReport(
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getOccupancyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await ReportService.getOccupancyReport(
        req.query.startDate as string,
        req.query.endDate as string
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const role = req.query.role as string;
      const search = req.query.search as string;

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            _count: { select: { reservations: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: { role },
        select: { id: true, fullName: true, email: true, role: true },
      });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }
}
