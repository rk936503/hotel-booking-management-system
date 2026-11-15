import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  static async simulate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PaymentService.simulatePayment({
        ...req.body,
        userId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.id as string);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}
