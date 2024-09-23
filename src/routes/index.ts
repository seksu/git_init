import express from 'express';
import { healthCheck } from '@common/be-core';

import partlistRoute from './partlist.route';
import detailPartlistRoute from './detailpartlist.route';
import pricingPartlistRoute from './pricingpartlist.route';
import rfqDetailRoute from './rfqdetail.route';
import priceHistoryRoute from './pricehistory.route';
import costVarianceRoute from './costvariance.route';
import finishPartlistRoute from './finishpartlist.route';
import psmrRoutes from './psmr.route';

const router = express.Router();



router.use('/partlist', partlistRoute); // 01 BS01001 FinishedSourcingPartList_YYYYMMDDHHMISS
router.use('/detail_partlist', detailPartlistRoute); // 02 BS01002 DetailSourcingPartList_YYYYMMDDHHMISS
router.use('/pricing_partlist', pricingPartlistRoute); // 03 BS01003 FinishPricingPartList_YYYYMMDDHHMISS
router.use('/rfq_detail', rfqDetailRoute); // 04 + 05
//04 BS01004 RFQ Detail OE Pricing Part List
//05 BS01005 RFQ Detail Export Pricing Part List
router.use('/price_history', priceHistoryRoute); // 06 BS01006 Price History Report
router.use('/cost_variance', costVarianceRoute); // 07 BS01007 Cost Variance Report (by Reason Code)
router.use('/finish_partlist', finishPartlistRoute); // 08 BS01008 Finish OE/Export Pricing Part List

router.use('/', psmrRoutes);

router.all('/health', healthCheck());

export default router;
