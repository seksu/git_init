// 07 UISS_BS01007_Cost Variance Report by Reason_Report
import { Request, Response, NextFunction } from 'express';

import service from '../services/pricehistory.service';

import * as handlers from '@common/trim-shared/handlers';

import { writeDetailLog } from '../utils/logs';
import { getProcessNo } from '../db/getApplicationId'
import dayjs from 'dayjs';

const batchInfo = {
    functionId: 'BTRI4307',
    moduleId: 'BTRI4',
    functionName: 'PSMR Cost Variance Report(by Reason)'
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

    req.body.query["DETAIL_PRICE_CAT"] = `2`; //Fixed for this eport

    let firstRow = true;

    
    let currentList = await service.queryReasonCode({ ...req.body, userId, appId, ...batchInfo });

    let startColumn = 23 // X
    for (const item of currentList) {
        item.colIndex = (++startColumn);
    }

    return handlers.createExcelStream({
        templateId: 'BS01007',
        getData: ({ page, perPage }) => service.getDataReport({ ...req.body, userId, appId, ...batchInfo }),
        formatFilename: ()=>{
            return `CostVarianceReportByReason_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
        },
        customRow(row, { values, instance }) {
            if (firstRow) {
                firstRow = false;

                //header

                let headerRow = 11
                // for (const com of additList) {
                for (const item of currentList) {
                    row.worksheet.getRow(headerRow).getCell(item.colIndex).value = `${item.DETAIL_PRICE_CODE} : ${item.DETAIL_PRICE_DESC}`                 
                    row.worksheet.getRow(headerRow).getCell(item.colIndex).style = row.worksheet.getRow(headerRow).getCell(item.colIndex - 1).style              
                }
                //
                row.worksheet.getRow(headerRow-1).getCell(23+1).value = `Detail Price Reason Code`                 
                row.worksheet.getRow(headerRow-1).getCell(23+1).style = row.worksheet.getRow(headerRow).getCell(23).style
                row.worksheet.mergeCells(headerRow-1, 23+1, headerRow-1, startColumn );
            }

            const numberStyleColumn = 20;

            for (const header of currentList) {
                row.getCell(header.colIndex).style = row.getCell(numberStyleColumn).style
            }

            const { detailList } = values;

            if (!detailList)
                return;

            for (const detail of detailList) {

                const { CODE, PRICE} = detail

                //Get header
                const header = currentList.find(x => x.DETAIL_PRICE_CODE == CODE)
                if (!header)
                    continue;

                row.getCell(header.colIndex).value = Number(PRICE);
            }


        }
    })(req, res, next)
}
export default {
    generateExcel
};
