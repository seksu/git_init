import { Router } from 'express';
import costvariance from '../controllers/costvariance.controller';

const router = Router();
// 07 UISS_BS01007_Cost Variance Report by Reason_Report
router.post('/', costvariance.generateExcel);

export default router;