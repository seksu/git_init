import { Router } from 'express';
import partlist from '../controllers/finishpartlist.controller';

const router = Router();

router.post('/', partlist.generateExcel);

export default router;