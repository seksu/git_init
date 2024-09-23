// 02 UISS_BS01002_Detail Sourcing Part List_Report
import { Request, Response, NextFunction } from 'express';

import service from '../services/detailpartlist.service';

import * as handlers from '@common/trim-shared/handlers';

import { writeDetailLog } from '../utils/logs';
import { getProcessNo } from '../db/getApplicationId'
import dayjs from 'dayjs';
import { head } from 'lodash';

const batchInfo = {
    functionId: 'BTRI4302',
    moduleId: 'BTRI4',
    functionName: 'PSMR Detail Sourcing Part List'
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

    let firstRow = true;


    let currentList = await service.queryCurrency({ ...req.body, userId, appId, ...batchInfo });

    let startColumn = 29
    for (const item of currentList) {
        item.colIndex = startColumn;
        startColumn += 3;
    }

    return handlers.createExcelStream({
        templateId: 'BS01002',
        getData: ({ page, perPage }) => service.getDataReport({ ...req.body, userId, appId, ...batchInfo }),
        formatFilename: () => {
            return `DetailSourcingPartList_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
        },
        customRow(row, { values, instance }) {
            if (firstRow) {
                firstRow = false;

                //header

                let headerRow = 8
                // for (const com of additList) {
                for (const item of currentList) {
                    row.worksheet.getRow(headerRow).getCell(item.colIndex).value = "Mat Imp."
                    row.worksheet.getRow(headerRow).getCell(item.colIndex + 1).value = "PS Part Imp."
                    row.worksheet.getRow(headerRow).getCell(item.colIndex + 2).value = "Import source/Currency"

                    row.worksheet.getRow(headerRow).getCell(item.colIndex).style = row.worksheet.getRow(headerRow).getCell(item.colIndex - 1).style
                    row.worksheet.getRow(headerRow).getCell(item.colIndex + 1).style = row.worksheet.getRow(headerRow).getCell(item.colIndex - 1).style
                    row.worksheet.getRow(headerRow).getCell(item.colIndex + 2).style = row.worksheet.getRow(headerRow).getCell(item.colIndex - 1).style

                }


            }

            const numberStyleColumn = 26;

            for (const header of currentList) {
                row.getCell(header.colIndex).style = row.getCell(numberStyleColumn).style
                row.getCell(header.colIndex + 1).style = row.getCell(numberStyleColumn).style
                row.getCell(header.colIndex + 2).style = row.getCell(1).style
            }

            const { detailList } = values;

            if (!detailList)
                return;

            for (const detail of detailList) {

                const { CURRENCY_CODE, MAT_IMP, PART_IMP } = detail

                //Get header
                const header = currentList.find(x => x.CURRENCY_CODE == CURRENCY_CODE)
                if (!header)
                    continue;

                row.getCell(header.colIndex).value = Number(MAT_IMP);
                row.getCell(header.colIndex + 1).value = Number(PART_IMP);
                row.getCell(header.colIndex + 2).value = CURRENCY_CODE;

                
            }


        }
    })(req, res, next)
}


export default {
    generateExcel
};
