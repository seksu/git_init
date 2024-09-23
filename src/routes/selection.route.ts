import { Router } from 'express';
import selectionController from '../controllers/selection.controller';

const router = Router();

router.get('/detail-price', selectionController.getDetailPriceCode);
router.get('/plant', selectionController.getCustomerPlant);

export default router;
