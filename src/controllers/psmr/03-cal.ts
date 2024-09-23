import { QueryTypes } from 'sequelize';
import db from '../../db';
import { sendToPIC } from '@common/email-notification/lib';
import { getProcessNo, writeDetailLog } from '../../utils/logs';

type Part = any;
type RFQ = any;
type RFQDetail = any;
type PO = any;

class BatchProcess {
    private batchDate: Date;
    private logCollection: { processName: string, dateTime: string, fileName: string, message: string }[];

    private appId: number;
    private userId: string;
    private functionId: string = 'BS01102';
    private moduleId: string = 'BTRI4';

    constructor() {
        this.batchDate = this.getBatchDate(null);
        this.logCollection = [];
    }

    private formattedDate(date: Date): string {
        // return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())} ${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}:${this.padZero(date.getSeconds())}`;
        return `${date.getFullYear()}-${this.padZero(date.getMonth() + 1)}-${this.padZero(date.getDate())}`;
    }

    private padZero(num: number): string {
        return num < 10 ? '0' + num : num.toString();
    }

    public async run(dateStr) {
        try {
            this.appId = await getProcessNo();
            this.userId = 'System';

            await writeDetailLog(this.functionId, this.moduleId, 'I', `Starting PSMR Cal03`, "BS00003INF", 'S', this.appId, this.userId);

            this.batchDate = this.getBatchDateParameter(dateStr);

            const partsList = await this.retrieveParts(this.batchDate);
            const rfqList = await this.retrieveRFQs(this.batchDate);
            const rfqDetailList = await this.retrieveRFQDetails(this.batchDate);
            const poList = await this.retrievePOs(this.batchDate);

            if (!partsList){
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PRD_PARTS`, "BS00001ERR", 'E', this.appId, this.userId);
                return
            }

            if (!rfqList){
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRV_EXP_RFQ`, "BS00001ERR", 'E', this.appId, this.userId);
                return
            }

            if (!rfqDetailList){
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRV_EXP_RFQ_DT`, "BS00001ERR", 'E', this.appId, this.userId);
                return
            }

            if (!poList){
                writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PO`, "BS00001ERR", 'E', this.appId, this.userId);
                return
            }

            await this.processParts(partsList);
            await this.processRFQs(rfqList);
            await this.processRFQDetails(partsList, rfqDetailList);
            await this.processPOs(poList);

            await this.writeLog();
            await this.checkBatchProcessStatus();
            writeDetailLog(this.functionId, this.moduleId, 'I', `Export Pricing Data Batch run success.`, "BS00003INF", 'E', this.appId, this.userId);
            console.log('Cal03 process completed successfully');
        } catch (error) {
            console.error(error);
            this.appendErrorLog('BatchProcess', 'N/A', error.message);
        } finally {
            if (this.logCollection.length > 0) {
                await this.sendErrorEmail();
            }
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

    private async retrieveParts(batchDate: Date): Promise<Part[]> {
        try {
            const sql = `SELECT * FROM TB_M_PRD_PARTS WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const results = await db.query<Part[]>(sql, {
                replacements: { batchDate : this.formattedDate(batchDate)  },
                type: QueryTypes.SELECT,
            });
            return results;
        } catch (error) {
            this.appendErrorLog('retrieveParts', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PRD_PARTS with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveRFQs(batchDate: Date): Promise<RFQ[]> {
        try {
            const sql = `SELECT * FROM TB_M_SRV_EXP_RFQ WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const results = await db.query<RFQ[]>(sql, {
                replacements: { batchDate : this.formattedDate(batchDate)  },
                type: QueryTypes.SELECT,
            });
            return results;
        } catch (error) {
            this.appendErrorLog('retrieveRFQs', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRV_EXP_RFQ with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrieveRFQDetails(batchDate: Date): Promise<RFQDetail[]> {
        try {
            const sql = `SELECT * FROM TB_M_SRV_EXP_RFQ_DT WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const results = await db.query<RFQDetail[]>(sql, {
                replacements: { batchDate : this.formattedDate(batchDate)  },
                type: QueryTypes.SELECT,
            });
            return results;
        } catch (error) {
            this.appendErrorLog('retrieveRFQDetails', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_SRV_EXP_RFQ_DT with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async retrievePOs(batchDate: Date): Promise<PO[]> {
        try {
            const sql = `SELECT * FROM TB_M_PO WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const results = await db.query<PO[]>(sql, {
                replacements: { batchDate : this.formattedDate(batchDate)  },
                type: QueryTypes.SELECT,
            });
            return results;
        } catch (error) {
            this.appendErrorLog('retrievePOs', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PO with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processParts(partsList: Part[]) {
        if (!partsList) {
            return;
        }

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
            const sql = `SELECT COUNT(*) AS count FROM TB_R_EXP_PO WHERE TRIGGER_DATA_CAT = :triggerDataCat AND PART_NO = :partNo AND SUPPLIER_CODE = :supplierCode AND PROJECT_CODE = :projectCode AND NAMC_CODE = :namcCode AND DOCK_CODE = :dockCode AND COLOUR_CODE = :colourCode AND INTERIM_PRICING_F = :interimPricingF AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            const result = await db.query<{ count: number }[]>(sql, {
                replacements: {
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
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
            const sql = `INSERT INTO TB_R_EXP_PO (TRIGGER_DATA_CAT, PART_NO, SUPPLIER_CODE, PROJECT_CODE, NAMC_CODE, DOCK_CODE, COLOUR_CODE, INTERIM_PRICING_F, RFQ_CAT, RFQ_NO, REV_NO, STAGE, TRIGGER_TYPE, PART_TYPE, BUYER_CODE, PART_NAME, TRIGGER_RECEIVED_DATE, SYSTEM_ASSIGNED_DUE_DATE, FINAL_SRC_DUE_DATE, ECI_NO) VALUES (:triggerDataCat, :partNo, :supplierCode, :projectCode, :namcCode, :dockCode, :colourCode, :interimPricingF, :rfqCat, :rfqNo, :revNo, :stage, :triggerType, :partType, :buyerCode, :partName, TO_DATE(:triggerReceivedDate, 'YYYY-MM-DD'), TO_DATE(:systemAssignedDueDate, 'YYYY-MM-DD'), TO_DATE(:finalSrcDueDate, 'YYYY-MM-DD'), :eciNo)`;
            await db.query(sql, {
                replacements: {
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                    stage: part.STAGE,
                    triggerType: part.TRIGGER_TYPE,
                    partType: part.PART_TYPE,
                    buyerCode: part.BUYER_CODE,
                    partName: part.PART_NAME,
                    triggerReceivedDate: part.TRIGGER_RECEIVED_DATE,
                    systemAssignedDueDate: part.SYSTEM_ASSIGNED_DUE_DATE,
                    finalSrcDueDate: part.FINAL_SRC_DUE_DATE,
                    eciNo: part.ECI_NO,
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            this.appendErrorLog('insertPart', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_EXP_PO with[1] `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updatePart(part: Part) {
        try {
            const sql = `UPDATE TB_R_EXP_PO SET STAGE = :stage, TRIGGER_TYPE = :triggerType, PART_TYPE = :partType, BUYER_CODE = :buyerCode, PART_NAME = :partName, TRIGGER_RECEIVED_DATE = TO_DATE(:triggerReceivedDate, 'YYYY-MM-DD'), SYSTEM_ASSIGNED_DUE_DATE = TO_DATE(:systemAssignedDueDate, 'YYYY-MM-DD'), FINAL_SRC_DUE_DATE = TO_DATE(:finalSrcDueDate, 'YYYY-MM-DD'), ECI_NO = :eciNo WHERE TRIGGER_DATA_CAT = :triggerDataCat AND PART_NO = :partNo AND SUPPLIER_CODE = :supplierCode AND PROJECT_CODE = :projectCode AND NAMC_CODE = :namcCode AND DOCK_CODE = :dockCode AND COLOUR_CODE = :colourCode AND INTERIM_PRICING_F = :interimPricingF AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            await db.query(sql, {
                replacements: {
                    stage: part.STAGE,
                    triggerType: part.TRIGGER_TYPE,
                    partType: part.PART_TYPE,
                    buyerCode: part.BUYER_CODE,
                    partName: part.PART_NAME,
                    triggerReceivedDate: part.TRIGGER_RECEIVED_DATE,
                    systemAssignedDueDate: part.SYSTEM_ASSIGNED_DUE_DATE,
                    finalSrcDueDate: part.FINAL_SRC_DUE_DATE,
                    eciNo: part.ECI_NO,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updatePart', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_EXP_PO with[2] `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processRFQs(rfqList: RFQ[]) {
        if (!rfqList) {
            return;
        }

        for (const rfq of rfqList) {
            try {
                await this.updateRFQ(rfq);
            } catch (error) {
                this.appendErrorLog('processRFQs', 'N/A', error.message);
            }
        }
    }

    private async updateRFQ(rfq: RFQ) {
        try {
            const sql = `UPDATE TB_R_EXP_PO 
                SET 
                    CURRENCY_CODE = :currencyCode, 
                    TOTAL_PIECE_PRC = :totalPiecePrc, 
                    TOTAL_TOOL_PRC = :totalToolPrc, 
                    VOLUME = :volume, 
                    RETRO_TOTAL_PRC = :retroTotalPrc, 
                    PIECE_PRC_MARK_UP = :piecePrcMarkUp, 
                    PIECE_PRC = :piecePrc, 
                    RFQ_EFFECTIVE_FROM = TO_DATE(:rfqEffectiveFrom, 'YYYY-MM-DD'), 
                    REF_EFFECTIVE_TO = TO_DATE(:rfqEffectiveTo, 'YYYY-MM-DD'),
                    SUPPLIER_COMPLETION_DATE = TO_DATE(:supplierCompletionDate, 'YYYY-MM-DD'), 
                    DUE_DATE = TO_DATE(:dueDate, 'YYYY-MM-DD'), 
                    ISSUED_DATE = TO_DATE(:issuedDate, 'YYYY-MM-DD'), 
                    RECEIVED_DATE = TO_DATE(:receivedDate, 'YYYY-MM-DD'), 
                    BUYER_CHECK_DATE = TO_DATE(:buyerCheckDate, 'YYYY-MM-DD'), 
                    BUYER_APPROVAL_DATE = TO_DATE(:buyerApprovalDate, 'YYYY-MM-DD'), 
                    LAST_APPROVAL_DATE = TO_DATE(:lastApprovalDate, 'YYYY-MM-DD'), 
                    MASS_PRC_APPROVAL_CAT = :massPrcApprovalCat, 
                    MASS_PRC_APPROVAL_NO = :massPrcApprovalNo, 
                    MASS_PRC_APPROVAL_REV_NO = :massPrcApprovalRevNo 
                WHERE 
                    RFQ_CAT = :rfqCat 
                    AND RFQ_NO = :rfqNo 
                    AND REV_NO = :revNo`;
            
            await db.query(sql, {
                replacements: {
                    currencyCode: rfq.CURRENCY_CODE,
                    totalPiecePrc: rfq.TOTAL_PIECE_PRC,
                    totalToolPrc: rfq.TOTAL_TOOL_PRC,
                    volume: rfq.ANNUAL_VOLUME/12,
                    retroTotalPrc: rfq.RETRO_TOTAL_PRC,
                    piecePrcMarkUp: rfq.PIECE_PRC_MARK_UP,
                    piecePrc: rfq.PIECE_PRC,
                    rfqEffectiveFrom: rfq.RFQ_EFFECTIVE_FROM, // 'YYYY-MM-DD' format
                    rfqEffectiveTo: rfq.RFQ_EFFECTIVE_TO, // 'YYYY-MM-DD' format
                    supplierCompletionDate: rfq.SUPPLIER_COMPLETION_DATE, // 'YYYY-MM-DD' format
                    dueDate: rfq.DUE_DATE, // 'YYYY-MM-DD' format
                    issuedDate: rfq.ISSUED_DATE, // 'YYYY-MM-DD' format
                    receivedDate: rfq.RECEIVED_DATE, // 'YYYY-MM-DD' format
                    buyerCheckDate: rfq.BUYER_CHECK_DATE, // 'YYYY-MM-DD' format
                    buyerApprovalDate: rfq.BUYER_APPROVAL_DATE, // 'YYYY-MM-DD' format
                    lastApprovalDate: rfq.LAST_APPROVAL_DATE, // 'YYYY-MM-DD' format
                    massPrcApprovalCat: rfq.MASS_PRC_APPROVAL_CAT,
                    massPrcApprovalNo: rfq.MASS_PRC_APPROVAL_NO,
                    massPrcApprovalRevNo: rfq.MASS_PRC_APPROVAL_REV_NO,
                    rfqCat: rfq.RFQ_CAT,
                    rfqNo: rfq.RFQ_NO,
                    revNo: rfq.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updateRFQ', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in updating record into TB_R_EXP_PO with[1] ` + error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }
    
    

    private async processRFQDetails(partsList, rfqDetailList: RFQDetail[]) {
        if (!rfqDetailList || !partsList) {
            return;
        }

        for (const part of partsList) {
            try {
                if (!(await this.isDuplicateRFQDetail(part))) {
                    await this.insertRFQDetail(rfqDetailList, part);
                } else {
                    await this.updateRFQDetail(rfqDetailList, part);
                }
            } catch (error) {
                this.appendErrorLog('processRFQDetails', 'N/A', error.message);
            }
        }
    }

    private async isDuplicateRFQDetail(part): Promise<boolean> {
        try {
            const sql = `SELECT COUNT(*) AS count FROM TB_R_EXP_PO_SUB WHERE TRIGGER_DATA_CAT = :triggerDataCat AND PART_NO = :partNo AND SUPPLIER_CODE = :supplierCode AND PROJECT_CODE = :projectCode AND NAMC_CODE = :namcCode AND DOCK_CODE = :dockCode AND COLOUR_CODE = :colourCode AND INTERIM_PRICING_F = :interimPricingF AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            const result = await db.query<{ count: number }[]>(sql, {
                replacements: {
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
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

    private async insertRFQDetail(rfqDetailList: RFQDetail[], part) {
        try {
            let MAT_IMP = 0;
            let PART_IMP = 0;
            let CURRENCY_CODE = '';
            let MAT_DOM	= 0;									
            let PS_PART_DOM	= 0;									
            let PROCESS	= 0;									
            let SPECIAL_PKG	= 0;									
            let HANDLING = 0;										
            let TRANSPORTATION = 0;										
            let OH = 0;										
            let MARK_UP	= 0;	
            let TOOLING_PC = 0;								
            for (const rfqDetail of rfqDetailList) {
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 1){
                        MAT_DOM = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 2){
                        MAT_IMP += rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 3){
                        PS_PART_DOM = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 4){
                        PART_IMP += rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 5){
                        PROCESS = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 22){
                        SPECIAL_PKG = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 23){
                        HANDLING = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 21){
                        TRANSPORTATION = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 7){
                        OH = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 8){
                        MARK_UP = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 10){
                        TOOLING_PC = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    CURRENCY_CODE = rfqDetail.CONTENTS_1; 
            }
            if (CURRENCY_CODE == null || CURRENCY_CODE == ''){
                CURRENCY_CODE = '2'
            }

            const sql_exp_po = `
                UPDATE TB_R_EXP_PO
                SET 
                    MAT_DOM = :matDom,
                    PS_PART_DOM = :psPartDom,
                    PROCESS = :process,
                    SPECIAL_PKG = :specialPkg,
                    HANDLING = :handling,
                    TRANSPORTATION = :transportation,
                    OH = :oh,
                    MARK_UP = :markUp,
                    TOOLING_PC = :toolingPc
                WHERE 
                    TRIGGER_DATA_CAT = :triggerDataCat
                    AND PART_NO = :partNo
                    AND SUPPLIER_CODE = :supplierCode
                    AND PROJECT_CODE = :projectCode
                    AND NAMC_CODE = :namcCode
                    AND DOCK_CODE = :dockCode
                    AND COLOUR_CODE = :colourCode
                    AND INTERIM_PRICING_F = :interimPricingF
                    AND RFQ_CAT = :rfqCat
                    AND RFQ_NO = :rfqNo
                    AND REV_NO = :revNo
                `;
            await db.query(sql_exp_po, {
                replacements: {
                    matDom: MAT_DOM,
                    psPartDom: PS_PART_DOM,
                    process: PROCESS,
                    specialPkg: SPECIAL_PKG,
                    handling: HANDLING,
                    transportation: TRANSPORTATION,
                    oh: OH,
                    markUp: MARK_UP,
                    toolingPc: TOOLING_PC,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });

            const sql_po_sub = `INSERT INTO TB_R_EXP_PO_SUB (TRIGGER_DATA_CAT, PART_NO, SUPPLIER_CODE, PROJECT_CODE, NAMC_CODE, DOCK_CODE, COLOUR_CODE, INTERIM_PRICING_F, RFQ_CAT, RFQ_NO, REV_NO, MAT_IMP, PART_IMP, CURRENCY_CODE) VALUES (:triggerDataCat, :partNo, :supplierCode, :projectCode, :namcCode, :dockCode, :colourCode, :interimPricingF, :rfqCat, :rfqNo, :revNo, :matImp, :partImp, :currencyCode)`;
            await db.query(sql_po_sub, {
                replacements: {
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                    matImp: MAT_IMP,
                    partImp: PART_IMP,
                    currencyCode: CURRENCY_CODE,
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            this.appendErrorLog('insertRFQDetail', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_EXP_PO_SUB with `+error.message, "BS00002ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updateRFQDetail(rfqDetailList: RFQDetail[], part) {
        try {
            let MAT_IMP = 0;
            let PART_IMP = 0;
            let CURRENCY_CODE = '';
            let MAT_DOM	= 0;									
            let PS_PART_DOM	= 0;									
            let PROCESS	= 0;									
            let SPECIAL_PKG	= 0;									
            let HANDLING = 0;										
            let TRANSPORTATION = 0;										
            let OH = 0;										
            let MARK_UP	= 0;	
            let TOOLING_PC = 0;								
            for (const rfqDetail of rfqDetailList) {
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 1){
                        MAT_DOM = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 2){
                        MAT_IMP += rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 3){
                        PS_PART_DOM = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 4){
                        PART_IMP += rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 5){
                        PROCESS = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 22){
                        SPECIAL_PKG = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 23){
                        HANDLING = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 21){
                        TRANSPORTATION = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 7){
                        OH = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 8){
                        MARK_UP = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    if (rfqDetail.QUOTATION_DETAIL_CAT == 10){
                        TOOLING_PC = rfqDetail.QUOTATION_DETAIL_COST;
                    }
                    CURRENCY_CODE = rfqDetail.CONTENTS_1; 
            }
            if (CURRENCY_CODE == null || CURRENCY_CODE == ''){
                CURRENCY_CODE = '2'
            }

            const sql_exp_po = `
                UPDATE TB_R_EXP_PO
                SET 
                    MAT_DOM = :matDom,
                    PS_PART_DOM = :psPartDom,
                    PROCESS = :process,
                    SPECIAL_PKG = :specialPkg,
                    HANDLING = :handling,
                    TRANSPORTATION = :transportation,
                    OH = :oh,
                    MARK_UP = :markUp,
                    TOOLING_PC = :toolingPc
                WHERE 
                    TRIGGER_DATA_CAT = :triggerDataCat
                    AND PART_NO = :partNo
                    AND SUPPLIER_CODE = :supplierCode
                    AND PROJECT_CODE = :projectCode
                    AND NAMC_CODE = :namcCode
                    AND DOCK_CODE = :dockCode
                    AND COLOUR_CODE = :colourCode
                    AND INTERIM_PRICING_F = :interimPricingF
                    AND RFQ_CAT = :rfqCat
                    AND RFQ_NO = :rfqNo
                    AND REV_NO = :revNo
                `;
            await db.query(sql_exp_po, {
                replacements: {
                    matDom: MAT_DOM,
                    psPartDom: PS_PART_DOM,
                    process: PROCESS,
                    specialPkg: SPECIAL_PKG,
                    handling: HANDLING,
                    transportation: TRANSPORTATION,
                    oh: OH,
                    markUp: MARK_UP,
                    toolingPc: TOOLING_PC,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
            
            const sql = `UPDATE TB_R_EXP_PO_SUB SET MAT_IMP = :matImp, PART_IMP = :partImp, CURRENCY_CODE = :currencyCode WHERE TRIGGER_DATA_CAT = :triggerDataCat AND PART_NO = :partNo AND SUPPLIER_CODE = :supplierCode AND PROJECT_CODE = :projectCode AND NAMC_CODE = :namcCode AND DOCK_CODE = :dockCode AND COLOUR_CODE = :colourCode AND INTERIM_PRICING_F = :interimPricingF AND RFQ_CAT = :rfqCat AND RFQ_NO = :rfqNo AND REV_NO = :revNo`;
            await db.query(sql, {
                replacements: {
                    matImp: MAT_IMP,
                    partImp: PART_IMP,
                    currencyCode: CURRENCY_CODE,
                    triggerDataCat: part.TRIGGER_DATA_CAT,
                    partNo: part.PART_NO.substring(0, 10),
                    supplierCode: part.SUPPLIER_CODE,
                    projectCode: part.PROJECT_CODE,
                    namcCode: part.NAMC_CODE,
                    dockCode: part.DOCK_CODE,
                    colourCode: part.COLOUR_CODE,
                    interimPricingF: part.INTERIM_PRICING_F,
                    rfqCat: part.RFQ_CAT,
                    rfqNo: part.RFQ_NO,
                    revNo: part.REV_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updateRFQDetail', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in updating record into TB_R_EXP_PO_SUB with `+error.message, "BS00002ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async processPOs(poList: PO[]) {
        if (!poList) {
            return;
        }

        if (poList.length === 0) {
            return;
        }

        for (const po of poList) {
            try {
                await this.updatePO(po);
            } catch (error) {
                this.appendErrorLog('processPOs', 'N/A', error.message);
            }
        }
    }

    private async updatePO(po: PO) {
        try {
            const sql = `UPDATE TB_R_EXP_PO SET SENT_PIECE_PO_DATE = :sentPiecePoDate, PO_NO = :poNo, PO_REVISION_NO = :poRevisionNo WHERE PO_NO = :poNo AND PO_REVISION_NO = :poRevisionNo`;
            await db.query(sql, {
                replacements: {
                    sentPiecePoDate: po.SENT_PIECE_PO_DATE,
                    poNo: po.PO_NO,
                    poRevisionNo: po.PO_REVISION_NO,
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updatePO', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in updating record into TB_R_EXP_PO with[2] `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async writeLog() {
        // TODO : Need to fix
        // const sql = `INSERT INTO TB_L_LOGGER (EVENT, STATUS) VALUES (:event, :status)`;
        // await db.query(sql, {
        //     replacements: {
        //         event: 'Batch process completed',
        //         status: 'SUCCESS',
        //     },
        //     type: QueryTypes.INSERT,
        // });
    }

    private async checkBatchProcessStatus() {
        // Implementation to check batch process status
    }

    private async sendErrorEmail() {
        try {
            await sendToPIC(
                this.logCollection,
                'PSMR00001',
                'seksit39@outlook.com',
                undefined,
                undefined,
                db
            );
        } catch (error) {
            console.error('Failed to send error email:', error);
        }
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
