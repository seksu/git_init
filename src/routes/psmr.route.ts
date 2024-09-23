import express from 'express';
import psmrBatch from '../controllers/psmr/batch';
import psmrCal01 from '../controllers/psmr/01-cal';
import psmrCal02 from '../controllers/psmr/02-cal';
import psmrCal03 from '../controllers/psmr/03-cal';
import psmrCal04 from '../controllers/psmr/04-cal';
const router = express.Router();

router.get('/batch', psmrBatch.execute);
router.get('/cal01', psmrCal01.execute);
router.get('/cal02', psmrCal02.execute);
router.get('/cal03', psmrCal03.execute);
router.get('/cal04', psmrCal04.execute);
export default router;