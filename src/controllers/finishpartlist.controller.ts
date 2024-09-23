// 08 UISS_BS01008_Finish_OE_Export_Pricing_Part_List_Report_OK
import { Request, Response, NextFunction } from 'express';

import service from '../services/finishpartlist.service';

import * as handlers from '@common/trim-shared/handlers';

import { writeDetailLog } from '../utils/logs';
import { getProcessNo } from '../db/getApplicationId'
import dayjs from 'dayjs';

const batchInfo = {
    functionId: 'BTRI4308',
    moduleId: 'BTRI4',
    functionName: 'PSMR Finish OE/Export Pricing Part List'
}

const generateExcel = async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.user?.userId || 'System'
    const appId = await getProcessNo();
    await writeDetailLog(batchInfo.functionId, batchInfo.moduleId, 'I', `Starting ${batchInfo.functionName}`, "MSTD0000AINF", 'S', appId, userId);

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
    const month = `${date.getMonth() + 1}`; // Get month without leading zero
    const day = `${date.getDate()}`; // Get day without leading zero
    const hours = `${date.getHours()}`; // Get hours
    const minutes = `0${date.getMinutes()}`.slice(-2); // Get minutes with leading zero if necessary

    req.body.query["PRINTED_BY"] = req.user.userId;
    req.body.query["DATE"] = `${month}/${day}/${year} ${hours}:${minutes}`;
    return handlers.createExcelStream({
        templateId: 'BS01008',
        getData: ({ page, perPage }) => service.getDataReport({ ...req.body, userId, appId, ...batchInfo }),
        formatFilename: ()=>{
            return `FinishOE_ExportPricingPartList_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
        }
    })(req, res, next)
}

export default {
    generateExcel,
};
