import { query } from 'express';
import joi from 'joi';

const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const dateField = joi
    .string()
    .optional()
    .max(10)
    .pattern(datePattern)
    .message("Date Format must like : 'DD/MM/YYYY' ");

export const search = {
    body: joi.object({
        //TODO should have at least 1 of carFamilyCode and projectCode
        carFamilyCode: joi.array().optional(),
        projectCode: joi.array().optional(),
        mc: joi.array().optional(),
        eciNo: joi.string().trim().optional().max(10),
        c5Status: joi.string().optional(),
        purFlag: joi.string().valid('Y', 'N').optional(),
        psGroup: joi.array().optional(),
        supplierCode: joi.string().trim().optional().max(5),
        partNo: joi.string().trim().optional().max(15),
        parentPartNo: joi.string().trim().optional().max(15),
        stage: joi.string().trim().optional().max(5),
        country: joi.string().trim().optional().max(10),
        buyerName: joi.string().trim().optional().max(30),
        supplierName: joi.string().trim().optional().max(50),
        partName: joi.string().trim().optional().max(50),
        cspPartNo: joi.string().trim().optional().max(1),
        dwgIssue: joi.string().valid('Y', 'N').optional(),

        buyerCode: joi.array().optional(),
        
        toolingOrderStatus: joi.string().valid('Y', 'N').optional(),
        priceFlag: joi.string().valid('Y', 'N').optional(),
        prodPartNoIssue: joi.string().valid('Y', 'N').optional(),
        status: joi.string().trim().valid('Y', 'N').optional(),
        //TODO From should <= To
        issueTyFrom: dateField,
        issueTyTo: dateField,
        toolingIssueFrom: dateField,
        toolingIssueTo: dateField,
        dueDateFrom: dateField,
        dueDateTo: dateField,
        dwgIssuePlanFrom: dateField,
        dwgIssuePlanTo: dateField,

        

    }).options({ allowUnknown: true }),
};

const rows = joi.array().items(
    joi.object({
        rowId: joi.string().trim().length(18).message('{{#label}} is invalid').required(),
    })
);

export const disuse = {
    body: joi.object({
        items: rows.min(1).required(),
        duFlag :joi.string().required(),
        reason:joi.string().required().min(255)
    })
};

export const additional = {
    query: joi.object({
        projectCode: joi.string().required()
    })
};

export const partlist = {
    body: joi.object({
        mcCode :joi.string().required(),
        projectCode :joi.string().required(),
        familyCode :joi.string().required(),
        partNumber :joi.string().required(),
        stage :joi.string().required(),
        finishedDate :joi.string().required(),
        supplierCode :joi.string().required(),
        buyerCode :joi.string().required(),
        activeStatus :joi.string().required(),
        letterDate :joi.string().required(),
    })
};

