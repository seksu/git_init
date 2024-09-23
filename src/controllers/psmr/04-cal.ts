import db from '../../db';
import { QueryTypes } from 'sequelize';
import { sendToPIC } from '@common/email-notification/lib';
import { getProcessNo, writeDetailLog } from '../../utils/logs';

interface PurchaseOrder {
    HANDLING_SEQ_NO: string;
    PURCHASING_ITEM: string;
    PARTS_CAT: string;
    PART_NO: string;
    PART_NAME: string;
    NAMC_CODE: string;
    SUPPLIER_CODE: string;
    SUPPLIER_PLANT_CODE: string;
    DOCK_CODE: string;
    COLOUR_CODE: string;
    UNIT_PRICE: number;
    BUYER_CODE: string;
    MINOR_CODE: string;
    SENT_PIECE_PO_DATE: Date;
    EFFECTIVE_FROM_DATE: Date;
    EFFECTIVE_TO_DATE: Date;
    CURRENCY_CAT: string;
    PRICING_REASON_CODE: string;
    ECI_NO: string;
    PO_NO: string;
    PO_REVISION_NO: string;
    SALES_CONTACT_COUNTRY: string;
    SUPPLIER_INTERFACE_METHOD: string;
    DETAIL_PRICE_CAT: string;
    DETAIL_PRICE_CODE: string;
    DETAIL_PRICE: number;
}

// Define an interface for the expected result structure
interface CountResult {
    count: number;
}

class BatchProcess {
    private batchDate: Date;
    private logCollection: { processName: string, dateTime: string, fileName: string, message: string }[];

    private appId: number;
    private userId: string;
    private functionId: string = 'BS01103';
    private moduleId: string = 'BTRI4';

    constructor() {
        this.batchDate = this.getBatchDateParameter(null) || new Date();
        this.logCollection = [];
    }

    private getBatchDateParameter(dateStr): Date | null {
        // Fetch the batch date parameter from somewhere, e.g., process environment or database
        return new Date(dateStr); // Default to current date if not specified
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

            await writeDetailLog(this.functionId, this.moduleId, 'I', `Starting PSMR Cal04`, "BS00003INF", 'S', this.appId, this.userId);

            this.batchDate = this.getBatchDateParameter(dateStr);

            const purchaseOrders = await this.retrievePurchaseOrders();

            if (purchaseOrders.length === 0) {
                await writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PO`, "BS00003INF", 'E', this.appId, this.userId);
                return;
            }
            let TOTAL_PRICE_IMPACT = 0;
            for (const order of purchaseOrders) {
                if (order.DETAIL_PRICE_CAT == '2' && order.DETAIL_PRICE_CODE != "000") {
                    TOTAL_PRICE_IMPACT += order.DETAIL_PRICE;
                }
            }
            for (const order of purchaseOrders) {
                const isDuplicate = await this.checkDuplicate(order);
                if (isDuplicate) {
                    await this.updatePurchaseOrder(order,TOTAL_PRICE_IMPACT);
                } else {
                    await this.insertPurchaseOrder(order,TOTAL_PRICE_IMPACT);
                }
                const isDuplicatePriceReason = await this.checkDuplicatePriceReason(order);
                if (isDuplicatePriceReason) {
                    await this.updatePriceReason(order);
                } else {
                    await this.insertPriceReason(order);
                }
            }
            await this.checkBatchProcessStatus();
        } catch (error) {
            console.error('Error during batch process:', error);
            this.appendErrorLog('BatchProcess', 'N/A', error.message);
            await this.writeLog('Batch process failed with error: ' + error.message);
        } finally {
            writeDetailLog(this.functionId, this.moduleId, 'I', `Price History & Variance Reason Batch run success.`, "BS00003INF", 'E', this.appId, this.userId);
            console.log('Cal04 process completed successfully');
            if (this.logCollection.length > 0) {
                // await this.sendErrorEmail();
            }
        }
    }

    private async retrievePurchaseOrders(): Promise<PurchaseOrder[]> {
        try {
            const sql = `SELECT * FROM TB_M_PO WHERE UPDATED_DATE = TO_DATE(:batchDate, 'YYYY-MM-DD')`;
            const results = await db.query<PurchaseOrder>(sql, {
                replacements: { batchDate: this.formattedDate(this.batchDate) },
                type: QueryTypes.SELECT,
            });
            return results;
        } catch (error) {
            this.appendErrorLog('retrievePurchaseOrders', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Fail to retrieve the TB_M_PO with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async checkDuplicate(order: PurchaseOrder): Promise<boolean> {
        try {
            const sql = `
                SELECT COUNT(*) AS count FROM TB_R_PRICE_HIST
                WHERE PART_CAT = :PART_CAT AND PART_NO = :PART_NO AND NAMC_CODE = :NAMC_CODE AND SUPPLIER_CODE = :SUPPLIER_CODE
                AND SUPPLIER_PLANT_CODE = :SUPPLIER_PLANT_CODE AND DOCK_CODE = :DOCK_CODE AND COLOUR_CODE = :COLOUR_CODE`;
            const [results] = await db.query<CountResult[]>(sql, {
                replacements: {
                    PART_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                },
                type: QueryTypes.SELECT,
            });

            // Accessing the first result's count property safely
            if (results.length > 0 && typeof results[0].count === 'number') {
                return results[0].count > 0;
            } else {
                return false;
            }
        } catch (error) {
            this.appendErrorLog('checkDuplicate', 'N/A', error.message);
            // throw error;
        }
    }

    private async insertPurchaseOrder(order: PurchaseOrder, TOTAL_PRICE_IMPACT: number) {
        try {
            const sql = `
                INSERT INTO TB_R_PRICE_HIST ( PARTS_CAT, PART_NO, PART_NAME, NAMC_CODE, SUPPLIER_CODE, SUPPLIER_PLANT_CODE, DOCK_CODE, COLOUR_CODE, BUYER_CODE, LV, UNIT_PRICE, SENT_PIECE_PO_DATE, EFFECTIVE_FROM_DATE, EFFECTIVE_TO_DATE, CURRENCY_CAT, PRICING_REASON_CODE, ECI_NO, PO_NO, PO_REVISION_NO, SALES_CONTACT_COUNTRY, SUPPLIER_INTERFACE_METHOD, PREVIOUS_PRICE, TOTAL_PRICE_IMPACT) 
                VALUES ( :PARTS_CAT, :PART_NO, :PART_NAME, :NAMC_CODE, :SUPPLIER_CODE, :SUPPLIER_PLANT_CODE, :DOCK_CODE, :COLOUR_CODE, :BUYER_CODE, :LV, :UNIT_PRICE, TO_DATE(:SENT_PIECE_PO_DATE, 'YYYY-MM-DD'), TO_DATE(:EFFECTIVE_FROM_DATE, 'YYYY-MM-DD'), TO_DATE(:EFFECTIVE_TO_DATE, 'YYYY-MM-DD'), :CURRENCY_CAT, :PRICING_REASON_CODE, :ECI_NO, :PO_NO, :PO_REVISION_NO, :SALES_CONTACT_COUNTRY, :SUPPLIER_INTERFACE_METHOD, :PREVIOUS_PRICE, :TOTAL_PRICE_IMPACT)`;

            await db.query(sql, {
                replacements: {
                    PARTS_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    PART_NAME: order.PART_NAME,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                    BUYER_CODE: order.BUYER_CODE,
                    LV: order.MINOR_CODE,
                    UNIT_PRICE: order.UNIT_PRICE,
                    SENT_PIECE_PO_DATE: order.SENT_PIECE_PO_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    EFFECTIVE_FROM_DATE: order.EFFECTIVE_FROM_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    EFFECTIVE_TO_DATE: order.EFFECTIVE_TO_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    CURRENCY_CAT: order.CURRENCY_CAT,
                    PRICING_REASON_CODE: order.PRICING_REASON_CODE == '5' ? 'Y' : 'N',
                    ECI_NO: order.ECI_NO,
                    PO_NO: order.PO_NO,
                    PO_REVISION_NO: order.PO_REVISION_NO,
                    SALES_CONTACT_COUNTRY: order.SALES_CONTACT_COUNTRY, 
                    SUPPLIER_INTERFACE_METHOD: order.SUPPLIER_INTERFACE_METHOD,
                    PREVIOUS_PRICE: order.UNIT_PRICE - TOTAL_PRICE_IMPACT,
                    TOTAL_PRICE_IMPACT: TOTAL_PRICE_IMPACT
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            console.log("error : ",error)
            this.appendErrorLog('insertPurchaseOrder', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_PRICE_HIST with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updatePurchaseOrder(order: PurchaseOrder, TOTAL_PRICE_IMPACT: number) {
        try {
            const sql = `
                UPDATE TB_R_PRICE_HIST 
                SET 
                    PARTS_CAT = :PARTS_CAT,										
                    PART_NO	= :PART_NO,
                    PART_NAME = :PART_NAME,							
                    NAMC_CODE = :NAMC_CODE,						
                    SUPPLIER_CODE = :SUPPLIER_CODE,							
                    SUPPLIER_PLANT_CODE	= :SUPPLIER_PLANT_CODE,						
                    DOCK_CODE = :DOCK_CODE,	
                    COLOUR_CODE	= :COLOUR_CODE,						
                    BUYER_CODE = :BUYER_CODE,					
                    LEVEL = :LEVEL,					
                    UNIT_PRICE = :UNIT_PRICE,								
                    SENT_PIECE_PO_DATE = TO_DATE(:SENT_PIECE_PO_DATE, 'YYYY-MM-DD'),					
                    EFFECTIVE_FROM_DATE	= TO_DATE(:EFFECTIVE_FROM_DATE, 'YYYY-MM-DD'),			
                    EFFECTIVE_TO_DATE = TO_DATE(:EFFECTIVE_TO_DATE, 'YYYY-MM-DD'),	
                    CURRENCY_CAT = :CURRENCY_CAT,			
                    PRICING_REASON_CODE = :PRICING_REASON_CODE,							
                    ECI_NO = :ECI_NO,
                    PO_NO = :PO_NO,							
                    PO_REVISION_NO = :PO_REVISION_NO,										
                    SALES_CONTACT_COUNTRY = :SALES_CONTACT_COUNTRY,							
                    SUPPLIER_INTERFACE_METHOD = :SUPPLIER_INTERFACE_METHOD,
                    PREVIOUS_PRICE = :PREVIOUS_PRICE,
                    TOTAL_PRICE_IMPACT = :TOTAL_PRICE_IMPACT
                WHERE 
                PART_CAT = :PART_CAT									
                AND PART_NO = :PART_NO					
                AND NAMC_CODE = :NAMC_CODE								
                AND SUPPLIER_CODE = :SUPPLIER_CODE							
                AND SUPPLIER_PLANT_CODE = :SUPPLIER_PLANT_CODE							
                AND DOCK_CODE = :DOCK_CODE		
                AND COLOUR_CODE = :COLOUR_CODE`;							
            await db.query(sql, {
                replacements: {
                    PARTS_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    PART_NAME: order.PART_NAME,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                    BUYER_CODE: order.BUYER_CODE,
                    LEVEL: order.MINOR_CODE,
                    UNIT_PRICE: order.UNIT_PRICE,
                    SENT_PIECE_PO_DATE: order.SENT_PIECE_PO_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    EFFECTIVE_FROM_DATE: order.EFFECTIVE_FROM_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    EFFECTIVE_TO_DATE: order.EFFECTIVE_TO_DATE.toString().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
                    CURRENCY_CAT: order.CURRENCY_CAT,
                    PRICING_REASON_CODE: order.PRICING_REASON_CODE,
                    ECI_NO: order.ECI_NO,
                    PO_NO: order.PO_NO,
                    PO_REVISION_NO: order.PO_REVISION_NO,
                    SALES_CONTACT_COUNTRY: order.SALES_CONTACT_COUNTRY, 
                    SUPPLIER_INTERFACE_METHOD: order.SUPPLIER_INTERFACE_METHOD,
                    PREVIOUS_PRICE: order.UNIT_PRICE - TOTAL_PRICE_IMPACT,
                    TOTAL_PRICE_IMPACT: TOTAL_PRICE_IMPACT
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updatePurchaseOrder', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in updating record into TB_R_PRICE_HIST with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async checkDuplicatePriceReason(order: PurchaseOrder): Promise<boolean> {
        try {
            const sql = `
                SELECT COUNT(*) AS count FROM TB_R_PRICE_HIST
                WHERE PART_CAT = :PART_CAT AND PART_NO = :PART_NO AND NAMC_CODE = :NAMC_CODE AND SUPPLIER_CODE = :SUPPLIER_CODE
                AND SUPPLIER_PLANT_CODE = :SUPPLIER_PLANT_CODE AND DOCK_CODE = :DOCK_CODE AND COLOUR_CODE = :COLOUR_CODE`;
            const [results] = await db.query<CountResult[]>(sql, {
                replacements: {
                    PART_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                },
                type: QueryTypes.SELECT,
            });

            // Accessing the first result's count property safely
            if (results.length > 0 && typeof results[0].count === 'number') {
                return results[0].count > 0;
            } else {
                return false;
            }
        } catch (error) {
            this.appendErrorLog('checkDuplicate', 'N/A', error.message);
            // throw error;
        }
    }

    private async insertPriceReason(order: PurchaseOrder) {
        try {
            const sql = `
                INSERT INTO TB_R_PRICE_REASON ( 
                    PARTS_CAT,										
                    PART_NO,										
                    NAMC_CODE,										
                    SUPPLIER_CODE,										
                    SUPPLIER_PLANT_CODE,									
                    DOCK_CODE,									
                    COLOUR_CODE,										
                    PO_REVISION_NO,										
                    DETAIL_PRICE_CAT,										
                    DETAIL_PRICE_CODE,										
                    DETAIL_PRICE										
                ) 
                VALUES (:PARTS_CAT, :PART_NO, :NAMC_CODE, :SUPPLIER_CODE, :SUPPLIER_PLANT_CODE, :DOCK_CODE, :COLOUR_CODE, :PO_REVISION_NO, :DETAIL_PRICE_CAT, :DETAIL_PRICE_CODE, :DETAIL_PRICE)`;

            await db.query(sql, {
                replacements: {
                    PARTS_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                    PO_REVISION_NO: order.PO_REVISION_NO,
                    DETAIL_PRICE_CAT: order.DETAIL_PRICE_CAT,
                    DETAIL_PRICE_CODE: order.DETAIL_PRICE_CODE,
                    DETAIL_PRICE: order.DETAIL_PRICE
                },
                type: QueryTypes.INSERT,
            });
        } catch (error) {
            console.log("error : ",error)
            this.appendErrorLog('insertPurchaseOrder', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in inserting record into TB_R_PRICE_REASON with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async updatePriceReason(order: PurchaseOrder) {
        try {
            const sql = `
                UPDATE TB_R_PRICE_REASON 
                SET 							
                    DETAIL_PRICE = :DETAIL_PRICE								
                WHERE 
                    PART_CAT = :PART_CAT
                    AND PART_NO = :PART_NO
                    AND NAMC_CODE = :NAMC_CODE
                    AND SUPPLIER_CODE = :SUPPLIER_CODE
                    AND SUPPLIER_PLANT_CODE = :SUPPLIER_PLANT_CODE
                    AND DOCK_CODE = :DOCK_CODE
                    AND COLOUR_CODE = :COLOUR_CODE
                    AND PO_REVISION_NO = :PO_REVISION_NO
                    AND DETAIL_PRICE_CAT = :DETAIL_PRICE_CAT
                    AND DETAIL_PRICE_CODE = :DETAIL_PRICE_CODE`;

            await db.query(sql, {
                replacements: {
                    PARTS_CAT: order.PARTS_CAT,
                    PART_NO: order.PART_NO,
                    NAMC_CODE: order.NAMC_CODE,
                    SUPPLIER_CODE: order.SUPPLIER_CODE,
                    SUPPLIER_PLANT_CODE: order.SUPPLIER_PLANT_CODE,
                    DOCK_CODE: order.DOCK_CODE,
                    COLOUR_CODE: order.COLOUR_CODE,
                    PO_REVISION_NO: order.PO_REVISION_NO,
                    DETAIL_PRICE_CAT: order.DETAIL_PRICE_CAT,
                    DETAIL_PRICE_CODE: order.DETAIL_PRICE_CODE,
                    DETAIL_PRICE: order.DETAIL_PRICE
                },
                type: QueryTypes.UPDATE,
            });
        } catch (error) {
            this.appendErrorLog('updatePurchaseOrder', 'N/A', error.message);
            writeDetailLog(this.functionId, this.moduleId, 'E', `Error in updating record into TB_R_PRICE_REASON with : `+error.message, "BS00001ERR", 'E', this.appId, this.userId);
            // throw error;
        }
    }

    private async writeLog(message: string) {
        console.log(message); // Replace with actual logging mechanism
    }

    private async checkBatchProcessStatus() {
        // Implement checks to determine if the batch process was successful or not
        // For example, checking the log entries or database flags
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
