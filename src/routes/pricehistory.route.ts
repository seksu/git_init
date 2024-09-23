import { Router } from 'express';
import pricehistory from '../controllers/pricehistory.controller';

const router = Router();

router.post('/', pricehistory.generateExcel);

export default router;