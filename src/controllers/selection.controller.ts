import { NextFunction, Request, Response } from 'express';
import selectionService from '../services/selection.service';

const getDetailPriceCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await selectionService.getDetailPriceCode();
      res.json(result);
    } catch (error) {
      next(error);
    }
};

const getCustomerPlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await selectionService.getCustomerPlant();
    res.json(result);
  } catch (error) {
    next(error);
  }
}; 

export default {
  getDetailPriceCode,
  getCustomerPlant
};
  