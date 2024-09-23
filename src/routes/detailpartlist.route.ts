import { Router } from 'express';
import partlist from '../controllers/detailpartlist.controller';

const router = Router();

router.post('/', partlist.generateExcel);
// router.post('/report-ex', partlist.generateExcelEX);

export default router;