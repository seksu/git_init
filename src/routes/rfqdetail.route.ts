import { Router } from 'express';
import partlist from '../controllers/rfqdetail.controller';

const router = Router();

router.post('/report-oe', partlist.generateExcelOE);
router.post('/report-ex', partlist.generateExcelEX);

export default router;