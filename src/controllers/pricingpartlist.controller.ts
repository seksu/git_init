// 03 UISS_BS01003_Finished Pricing Part List_Report
import { Request, Response, NextFunction } from 'express';

import service from '../services/pricingpartlist.service';

import * as handlers from '@common/trim-shared/handlers';

import { writeDetailLog } from '../utils/logs';
import { getProcessNo } from '../db/getApplicationId'
import dayjs from 'dayjs';

const batchInfo = {
    functionId: 'BTRI4303',
    moduleId: 'BTRI4',
    functionName: 'PSMR Finished Pricing Part List'
}
const generateExcel = async (req: Request, res: Response, next: NextFunction) => {
    
    const userId = req.user?.userId || 'System'
    const appId = await getProcessNo();
    await writeDetailLog(batchInfo.functionId, batchInfo.moduleId, 'I', `Starting ${batchInfo.functionName} (OE)`, "MSTD0000AINF", 'S', appId, userId);

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
    const month = `${date.getMonth() + 1}`; // Get month without leading zero
    const day = `${date.getDate()}`; // Get day without leading zero
    const hours = `${date.getHours()}`; // Get hours
    const minutes = `0${date.getMinutes()}`.slice(-2); // Get minutes with leading zero if necessary

    req.body.query["PRINTED_BY"] = req.user.userId;
    req.body.query["DATE"] = `${month}/${day}/${year} ${hours}:${minutes}`;
    return handlers.createExcelStream({
        templateId: 'BS01003',
        getData: ({ page, perPage }) => service.getDataReport({ ...req.body, userId, appId, ...batchInfo }),
        formatFilename: ()=>{
            return `FinishPricingPartList_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
        }
    })(req, res, next)
}

export default {
    generateExcel
};
