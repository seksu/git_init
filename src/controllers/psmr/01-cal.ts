import { QueryTypes } from 'sequelize';
import db from '../../db';
import { sendToPIC } from '@common/email-notification/lib';
import { getProcessNo, writeDetailLog } from '../../utils/logs';
import { logger } from '@common/be-core';

type Part = any;
type RFQ = any;
type RFQDetail = any;
type Supplier = any;
type TYNTY = any;

class BatchProcess {
    private batchDate: Date;
    private logCollection: { processName: string, dateTime: string, fileName: string, message: string }[];
    private appId: number;
    private userId: string;
    private functionId: string = 'BS01100';
    private moduleId: string = 'BTRI4';

    constructor() {
        this.batchDate = this.getBatchDate(null);
        this.logCollection = [];
    }

    public async run(dateStr) {
        this.batchDate = this.getBatchDateParameter(dateStr);

        this.appId = await getProcessNo();
        this.userId = 'System';

        try {
            await writeDetailLog(this.functionId, this.moduleId, 'I', `Starting PSMR Cal01`, "BS00003INF", 'S', this.appId, this.userId);
            const partsList = await this.retrieveParts(this.batchDate);
            const rfqList = await this.retrieveRFQs(this.batchDate);
            const rfqDetailList = await this.retrieveRFQDetails(this.batchDate);
            const supplierList = await this.retrieveSuppliers(this.batchDate);
            const tyNtyList = await this.retrieveTYNTY(this.batchDate);

            if (!partsList) {
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PARTS`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }

            if (!rfqList) {
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }

            if (!rfqDetailList) {
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ_DT`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }

            if (!supplierList) {
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ_SUP`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }

            if (!tyNtyList) {
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_TY_NTY_CONTS`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }

            await this.processParts(partsList);
            await this.processRFQs(rfqList);
            await this.processRFQDetails(rfqDetailList, partsList);
            await this.processSuppliers(supplierList);
            await this.processTYNTY(tyNtyList);

            await this.writeLog();
            await this.checkBatchProcessStatus();
            writeDetailLog(this.functionId, this.moduleId, 'I', `OE Sourcing Data Type Batch run success.`, "BS00003INF", 'E', this.appId, this.userId);
            console.log('Cal01 process completed successfully');
        } catch (error) {
            console.error(error);
            this.appendErrorLog('BatchProcess', 'N/A', error.message);
            await this.sendErrorEmail();
        }
    }

    private getBatchDate(dateStr): Date {
        const batchDate = this.getBatchDateParameter(dateStr);
        return batchDate ? batchDate : new Date();
    }

    private getBatchDateParameter(dateStr): Date | null {
        // Implementation to get batch date parameter
        return new Date(dateStr);
    }

    private formattedDate(date: Date): string {
        // return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}:${this.padZero(date.getSeconds())}`;
        return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())}`;
    }

    private padZero(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }

    private async retrieveParts(batchDate: Date): Promise<Part[]> {
        try {
            const sql = `SELECT * FROM TB_M_PARTS WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const result = await db.query(sql, {
                replacements: { batchDate: this.formattedDate(batchDate) },
                type: QueryTypes.SELECT,
            });
            return result as Part[];
        } catch (error) {
            this.appendErrorLog('retrieveParts', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PARTS with : ` + error.message, "-", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveRFQs(batchDate: Date): Promise<RFQ[]> {
        try {
            const sql = `SELECT * FROM TB_M_SRC_RFQ WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const result = await db.query(sql, {
                replacements: { batchDate: this.formattedDate(batchDate) },
                type: QueryTypes.SELECT,
            });
            return result as RFQ[];
        } catch (error) {
            this.appendErrorLog('retrieveRFQs', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ with : ` + error.message, "-", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveRFQDetails(batchDate: Date): Promise<RFQDetail[]> {
        try {
            const sql = `SELECT * FROM TB_M_SRC_RFQ_DT WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const result = await db.query(sql, {
                replacements: { batchDate: this.formattedDate(batchDate) },
                type: QueryTypes.SELECT,
            });
            return result as RFQDetail[];
        } catch (error) {
            this.appendErrorLog('retrieveRFQDetails', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ_DT with : ` + error.message, "-", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveSuppliers(batchDate: Date): Promise<Supplier[]> {
        try {
            const sql = `SELECT * FROM TB_M_SRC_RFQ_SUP WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const result = await db.query(sql, {
                replacements: { batchDate: this.formattedDate(batchDate) },
                type: QueryTypes.SELECT,
            });
            return result as Supplier[];
        } catch (error) {
            this.appendErrorLog('retrieveSuppliers', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRC_RFQ_SUP with : ` + error.message, "-", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveTYNTY(batchDate: Date): Promise<TYNTY[]> {
        try {
            const sql = `SELECT * FROM TB_M_TY_NTY_CONTS WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const result = await db.query(sql, {
                replacements: { batchDate: this.formattedDate(batchDate) },
                type: QueryTypes.SELECT,
            });
            return result as TYNTY[];
        } catch (error) {
            this.appendErrorLog('retrieveTYNTY', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_TY_NTY_CONTS with : ` + error.message, "-", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processParts(partsList: Part[]) {
        for (const part of partsList) {
            try {
                if (!(await this.isDuplicatePart(part))) {
                    await this.insertPart(part);
                } else {
                    await this.updatePart(part);
                }
            } catch (error) {
                this.appendErrorLog('processParts', 'N/A', error.message);
            }
        }
    }

    private async isDuplicatePart(part: Part): Promise<boolean> {
        try {
            const partNo = part.PART_NO.substring(0, 10);

            const sql = `SELECT COUNT(*) AS count FROM TB_R_OE_SO WHERE PART_NO = :partNo AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            const result = await db.query(sql, {
                replacements: {
                    partNo,
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.SELECT,
            });
            return result[0]["COUNT"] > 0;
        } catch (error) {
            this.appendErrorLog('isDuplicatePart', 'N/A', error.message);
            // throw error;
        }
    }

    private async insertPart(part: Part) {
        try {
            const partNo = part.PART_NO.substring(0, 10);
            const level = part.PART_NO.substring(10, 12);

            const sql = `INSERT INTO TB_R_OE_SO (
                PART_NO, LV, PROJECT_CODE, SUPPLIER_CODE, NAMC_CODE, RFQ_CAT, RFQ_NO, REV_NO,
                STAGE, TRIGGER_DATA_CAT, TRIGGER_TYPE, PART_TYPE, BUYER_CODE, PART_NAME, PART_RELEASE_DATE,
                SYSTEM_ASSIGNED_DUE_DATE, FINAL_SRC_DUE_DATE, ECI_NO, FAMILY_CODE, YEAR_MODEL,
                TECH_INFO_PROMISE_DATE, ENG_REQ_SRC_DUE_DATE, ABOLITION_DATE, INACTIVE_F, CURRENT_PART_NO
            ) VALUES (
                :partNo, :level, :projectCode, :supplierCode, :namcCode, :rfqCat, :rfqNo, :revNo,
                :stage, :triggerDataCat, :triggerType, :partType, :buyerCode, :partName, TO_DATE(:partReleaseDate, 'YYYY-MM-DD'),
                TO_DATE(:systemAssignedDueDate, 'YYYY-MM-DD'), TO_DATE(:finalSrcDueDate, 'YYYY-MM-DD'), :eciNo, :familyCode, :yearModel,
                TO_DATE(:techInfoPromiseDate, 'YYYY-MM-DD'), TO_DATE(:engReqSrcDueDate, 'YYYY-MM-DD'), TO_DATE(:abolitionDate, 'YYYY-MM-DD'), :inactiveF, :currentPartNo
            )`;
            await db.query(sql, {
                replacements: {
                    partNo,
                    level,
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                    stage: part.STAGE,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    triggerType: part.TRIGGER_TYPE,
                    partType: part.PART_TYPE,
                    buyerCode: part.BUYER_CODE,
                    partName: part.PART_NAME,
                    partReleaseDate: part.PART_RELEASE_DATE,
                    systemAssignedDueDate: part.SYSTEM_ASSIGNED_DUE_DATE,
                    finalSrcDueDate: part.FINAL_SRC_DUE_DATE,
                    eciNo: part.ECI_NO,
                    familyCode: part.FAMILY_CODE,
                    yearModel: part.YEAR_MODEL,
                    techInfoPromiseDate: part.TECH_INFO_PROMISE_DATE,
                    engReqSrcDueDate: part.ENG_REQ_SRC_DUE_DATE,
                    abolitionDate: part.ABOLITION_DATE,
                    inactiveF: part.INACTIVE_F,
                    currentPartNo: part.CURRENT_PART_NO,
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            this.appendErrorLog('insertPart', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_OE_SO with ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updatePart(part: Part) {
        try {
            const partNo = part.PART_NO.substring(0, 10);
            const level = part.PART_NO.substring(10, 12);

            const sql = `UPDATE TB_R_OE_SO SET 
                STAGE = :stage, TRIGGER_DATA_CAT = :triggerDataCat, TRIGGER_TYPE = :triggerType, PART_TYPE = :partType, 
                BUYER_CODE = :buyerCode, PART_NAME = :partName, PART_RELEASE_DATE = TO_DATE(:partReleaseDate, 'YYYY-MM-DD'), SYSTEM_ASSIGNED_DUE_DATE = TO_DATE(:systemAssignedDueDate, 'YYYY-MM-DD'), 
                FINAL_SRC_DUE_DATE = TO_DATE(:finalSrcDueDate, 'YYYY-MM-DD'), ECI_NO = :eciNo, FAMILY_CODE = :familyCode, YEAR_MODEL = :yearModel, 
                TECH_INFO_PROMISE_DATE = TO_DATE(:techInfoPromiseDate, 'YYYY-MM-DD'), ENG_REQ_SRC_DUE_DATE = TO_DATE(:engReqSrcDueDate, 'YYYY-MM-DD'), ABOLITION_DATE = TO_DATE(:abolitionDate, 'YYYY-MM-DD'), 
                INACTIVE_F = :inactiveF, CURRENT_PART_NO = :currentPartNo 
                WHERE PART_NO = :partNo AND LV = :level AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND 
                NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            await db.query(sql, {
                replacements: {
                    partNo,
                    level,
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                    stage: part.STAGE,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    triggerType: part.TRIGGER_TYPE,
                    partType: part.PART_TYPE,
                    buyerCode: part.BUYER_CODE,
                    partName: part.PART_NAME,
                    partReleaseDate: part.PART_RELEASE_DATE,
                    systemAssignedDueDate: part.SYSTEM_ASSIGNED_DUE_DATE,
                    finalSrcDueDate: part.FINAL_SRC_DUE_DATE,
                    eciNo: part.ECI_NO,
                    familyCode: part.FAMILY_CODE,
                    yearModel: part.YEAR_MODEL,
                    techInfoPromiseDate: part.TECH_INFO_PROMISE_DATE,
                    engReqSrcDueDate: part.ENG_REQ_SRC_DUE_DATE,
                    abolitionDate: part.ABOLITION_DATE,
                    inactiveF: part.INACTIVE_F,
                    currentPartNo: part.CURRENT_PART_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updatePart', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO with[1] ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processRFQs(rfqList: RFQ[]) {
        let PRICE_LESS_TOOL = 0;
        for (const rfq of rfqList) {
            if (rfq.QUOTATION_DETAIL_CAT == 10) {
                PRICE_LESS_TOOL += rfq.TOTAL_PIECE_PRC
            }
        }

        for (const rfq of rfqList) {
            try {
                await this.updateRFQ(rfq, PRICE_LESS_TOOL);
            } catch (error) {
                this.appendErrorLog('processRFQs', 'N/A', error.message);
            }
        }
    }

    private async updateRFQ(rfq: RFQ, PRICE_LESS_TOOL: number) {
        try {
            const sql = `UPDATE TB_R_OE_SO SET 
                TOTAL_PIECE_PRC = :totalPiecePrc, TOTAL_TOOL_PRC = :totalToolPrc, CURRENCY_CODE = :currencyCode, 
                SUPPLIER_COMPLETION_DATE = TO_DATE(:supplierCompletionDate, 'YYYY-MM-DD'), VOLUME = :volume, PER_VEHICLE_PIECES = :perVehiclePieces, 
                VEHICLES_PER_MONTH = :vehiclesPerMonth, DUE_DATE = TO_DATE(:dueDate, 'YYYY-MM-DD'), ISSUE_APPROVAL_DATE = TO_DATE(:issueApprovalDate, 'YYYY-MM-DD'), 
                ISSUED_DATE = TO_DATE(:issuedDate, 'YYYY-MM-DD'), RECEIVED_DATE = TO_DATE(:receivedDate, 'YYYY-MM-DD'), BUYER_CHECK_DATE = TO_DATE(:buyerCheckDate, 'YYYY-MM-DD'), 
                BUYER_APPROVAL_DATE = TO_DATE(:buyerApprovalDate, 'YYYY-MM-DD'), LAST_APPROVAL_DATE = TO_DATE(:lastApprovalDate, 'YYYY-MM-DD'), SRC_TYPE = :srcType, 
                SRC_COMPLETION_DATE = TO_DATE(:srcCompletionDate, 'YYYY-MM-DD'), PRICE_LESS_TOOL = :priceLessTool 
                WHERE PART_NO = :partNo AND LV = :level AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND 
                NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            await db.query(sql, {
                replacements: {
                    totalPiecePrc: rfq.TOTAL_PIECE_PRC,
                    totalToolPrc: rfq.TOTAL_TOOL_PRC,
                    currencyCode: rfq.CURRENCY_CODE,
                    supplierCompletionDate: rfq.SUPPLIER_COMPLETION_DATE,
                    volume: rfq.ANNUAL_VOLUME / 12,
                    perVehiclePieces: rfq.PER_VEHICLE_PIECES,
                    vehiclesPerMonth: rfq.VEHICLES_PER_MONTH,
                    dueDate: rfq.DUE_DATE,
                    issueApprovalDate: rfq.ISSUE_APPROVAL_DATE,
                    issuedDate: rfq.ISSUED_DATE,
                    receivedDate: rfq.RECEIVED_DATE,
                    buyerCheckDate: rfq.BUYER_CHECK_DATE,
                    buyerApprovalDate: rfq.BUYER_APPROVAL_DATE,
                    lastApprovalDate: rfq.LAST_APPROVAL_DATE,
                    srcType: rfq.SRC_TYPE,
                    srcCompletionDate: rfq.SRC_COMPLETION_DATE,
                    priceLessTool: PRICE_LESS_TOOL,
                    partNo: rfq.PART_NO.substring(0, 10),
                    level: rfq.PART_NO.substring(10, 12),
                    projectCode: rfq.PROJECT_CODE,
                    supplierCode: rfq.SUPPLIER_CODE4, // sek : I don't know why it is 4
                    namcCode: rfq.REF_NAMC_CODE,
                    rfqCat: rfq.RFQ_CAT,
                    rfqNo: rfq.RFQ_NO,
                    revNo: rfq.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updateRFQ', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO with[2] ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processRFQDetails(rfqDetailList: RFQDetail[], partsList: Part[]) {
        for (const part of partsList) {
            try {
                if (!(await this.isDuplicateRFQDetail(part))) {
                    await this.insertRFQDetail(rfqDetailList, part);
                } else {
                    await this.updateRFQDetailSum(rfqDetailList, part);
                }
            } catch (error) {
                this.appendErrorLog('processRFQDetails', 'N/A', error.message);
            }
        }
    }

    private async isDuplicateRFQDetail(part: Part): Promise<boolean> {
        try {
            const sql = `SELECT COUNT(*) AS count FROM TB_R_OE_SO_SUB WHERE PART_NO = :partNo AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            const result = await db.query(sql, {
                replacements: {
                    partNo: part.PART_NO.substring(0, 10),
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.SELECT,
            });
            return result[0]["COUNT"] > 0;
        } catch (error) {
            this.appendErrorLog('isDuplicateRFQDetail', 'N/A', error.message);
            // throw error;
        }
    }

    private async insertRFQDetail(rfqDetailList: RFQDetail[], part: Part) {
        try {

            let sumMatImp = 0;
            let sumPartImp = 0;
            let currencyCode = '';
            let MAT_DOM = 0;
            let PS_PART_DOM = 0;
            let PROCESS = 0;
            let SPECIAL_PKG = 0;
            let OH = 0;
            let MARK_UP = 0;
            let TOOLING_PC = 0;

            for (const rfqDetail of rfqDetailList) {
                if (rfqDetail.QUOTATION_DETAIL_CAT == 1) {
                    MAT_DOM = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 2) {
                    sumMatImp += rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 3) {
                    PS_PART_DOM = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 4) {
                    sumPartImp += rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 5) {
                    PROCESS = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 6) {
                    SPECIAL_PKG = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 7) {
                    OH = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 8) {
                    MARK_UP = rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 10) {
                    TOOLING_PC = rfqDetail.QUOTATION_DETAIL_COST
                }
                currencyCode = rfqDetail.CONTENTS_1
                if (currencyCode == null || currencyCode == '') {
                    currencyCode = '2'
                }
            }

            const sql_oe_so = `UPDATE TB_R_OE_SO SET 
                MAT_DOM = :MAT_DOM,								
                PS_PART_DOM	= :PS_PART_DOM,									
                PROCESS	= :PROCESS,				
                SPECIAL_PKG	= :SPECIAL_PKG,							
                OH = :OH,			
                MARK_UP	= :MARK_UP,
                TOOLING_PC = :TOOLING_PC
            WHERE PART_NO = :partNo AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;

            await db.query(sql_oe_so, {
                replacements: {
                    MAT_DOM: MAT_DOM,
                    PS_PART_DOM: PS_PART_DOM,
                    PROCESS: PROCESS,
                    SPECIAL_PKG: SPECIAL_PKG,
                    OH: OH,
                    MARK_UP: MARK_UP,
                    TOOLING_PC: TOOLING_PC,
                    partNo: part.PART_NO.substring(0, 10),
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });

            const sql_so_sub = `INSERT INTO TB_R_OE_SO_SUB (
                PART_NO, PROJECT_CODE, SUPPLIER_CODE, NAMC_CODE, RFQ_CAT, RFQ_NO, REV_NO, MAT_IMP, PART_IMP, CURRENCY_CODE
            ) VALUES (
                :partNo, :projectCode, :supplierCode, :namcCode, :rfqCat, :rfqNo, :revNo, :sumMatImp, :sumPartImp, :currencyCode
            )`;
            await db.query(sql_so_sub, {
                replacements: {
                    partNo: part.PART_NO.substring(0, 10),
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                    sumMatImp: sumMatImp,
                    sumPartImp: sumPartImp,
                    currencyCode: currencyCode,
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            console.log(error)
            this.appendErrorLog('insertRFQDetail', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO_SUB with[1] ` + error.message, "BS00002ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updateRFQDetailSum(rfqDetailList: RFQDetail[], part: Part) {
        try {
            let sumMatImp = 0;
            let sumPartImp = 0;
            let currencyCode = '';

            for (const rfqDetail of rfqDetailList) {
                if (rfqDetail.QUOTATION_DETAIL_CAT == 2) {
                    sumMatImp += rfqDetail.QUOTATION_DETAIL_COST
                }
                if (rfqDetail.QUOTATION_DETAIL_CAT == 4) {
                    sumPartImp += rfqDetail.QUOTATION_DETAIL_COST
                }
                currencyCode = rfqDetail.CONTENTS_1
                if (currencyCode == null || currencyCode == '') {
                    currencyCode = '2'
                }
            }

            const sql = `UPDATE TB_R_OE_SO_SUB SET 
                    MAT_IMP = :sumMatImp,
                    PART_IMP = :sumPartImp,
                    CURRENCY_CODE = :currencyCode
                WHERE PART_NO = :partNo AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            await db.query(sql, {
                replacements: {
                    sumMatImp: sumMatImp,
                    sumPartImp: sumPartImp,
                    currencyCode: currencyCode,
                    partNo: part.PART_NO.substring(0, 10),
                    projectCode: part.PROJECT_CODE,
                    supplierCode: part.SUPPLIER_CODE,
                    namcCode: part.NAMC_CODE,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            console.log(error)
            this.appendErrorLog('updateRFQDetailSum', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO_SUB with[2] ` + error.message, "BS00002ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processSuppliers(supplierList: Supplier[]) {
        for (const supplier of supplierList) {
            try {
                await this.updateSupplier(supplier);
            } catch (error) {
                this.appendErrorLog('processSuppliers', 'N/A', error.message);
            }
        }
    }

    private async updateSupplier(supplier: Supplier) {
        try {
            const sql = `UPDATE TB_R_OE_SO SET 
                SUPPLIER_SELECTION_F = :supplierSelectionF, ISSUED_LETTER_CAT = :issuedLetterCat 
                WHERE SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;

            const replacements = {
                supplierSelectionF: supplier.SUPPLIER_SELECTION_F,
                issuedLetterCat: supplier.ISSUED_LETTER_CAT,
                supplierCode: supplier.SUPPLIER_CODE,
                namcCode: supplier.NAMC_CODE,
                rfqCat: supplier.RFQ_CAT,
                rfqNo: supplier.RFQ_NO,
                revNo: supplier.REV_NO,
            };

            // Execute the query as before
            await db.query(sql, {
                replacements: replacements,
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updateSupplier', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO with[3] ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processTYNTY(tyNtyList: TYNTY[]) {
        for (const tyNty of tyNtyList) {
            try {
                await this.updateTYNTY(tyNty);
            } catch (error) {
                this.appendErrorLog('processTYNTY', 'N/A', error.message);
            }
        }
    }

    private async updateTYNTY(tyNty: TYNTY) {
        try {
            const sql = `
                UPDATE TB_R_OE_SO SET 
                    LETTER_SEQUENCE_NO = :letterSequenceNo, 
                    SALES_CONTACT_PERSON_CODE = :salesContactPersonCode, 
                    SUPPLIER_INTERFACE_METHOD = :supplierInterfaceMethod, 
                    ADDED_DATE = :addedDate
                WHERE 
                    PART_NO = :partNo AND PROJECT_CODE = :projectCode AND SUPPLIER_CODE = :supplierCode AND NAMC_CODE = :namcCode AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;

            await db.query(sql, {
                replacements: {
                    letterSequenceNo: tyNty.LETTER_SEQUENCE_NO,
                    salesContactPersonCode: tyNty.SALES_CONTACT_PERSON_CODE,
                    supplierInterfaceMethod: tyNty.SUPPLIER_INTERFACE_METHOD,
                    addedDate: tyNty.ADDED_DATE,
                    projectCode: tyNty.PROJECT_CODE,
                    partNo: tyNty.PART_NO,
                    supplierCode: tyNty.SUPPLIER_CODE,
                    namcCode: tyNty.NAMC_CODE,
                    rfqCat: tyNty.RFQ_CAT,
                    rfqNo: tyNty.RFQ_NO,
                    revNo: tyNty.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updateTYNTY', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to updating the record into TB_R_OE_SO with[4] ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async writeLog() {
        // Implementation for writing log
        // const sql = `INSERT INTO TB_L_LOGGER (LOG_DATE, LOG_MESSAGE) VALUES (TO_DATE(:logDate, 'YYYY-MM-DD'), :logMessage)`;
        // await db.query(sql, {
        //     replacements: {
        //         logDate: this.formattedDate(new Date()),
        //         logMessage: 'Batch process completed',
        //     },
        //     type: QueryTypes.INSERT,
        // });
    }

    private async checkBatchProcessStatus() {
        const isSuccess = await this.checkProcessStatus();
        if (!isSuccess) {
            await this.sendErrorEmail();
        }
        await this.exitBatchProcess();
    }

    private async checkProcessStatus(): Promise<boolean> {
        // Implementation to check batch process status
        return true;
    }

    private async sendErrorEmail() {
        try {
            // Implementation for sending error email
            const email = "seksit39@outlook.com";
            await sendToPIC(this.logCollection, 'PSMR00001', email, undefined, undefined, db);
        } catch (error) {
            console.error('Failed to send error email:', error);
        }
    }

    private async exitBatchProcess() {
        // Implementation to exit batch process
    }

    private appendErrorLog(processName: string, fileName: string, message: string) {
        const errorLog = {
            processName,
            dateTime: new Date().toISOString(),
            fileName,
            message,
        };
        this.logCollection.push(errorLog);
    }
}

function execute(req, res) {
    const dateStr = req.query.date;

    // Initialize and run the batch process
    const batchProcess = new BatchProcess();
    batchProcess.run(dateStr).catch(console.error);

    res.status(201).json({
        message: 'Batch is executing.',
    });
}

export default {
    execute,
}
