// 03 UISS_BS01003_Finished Pricing Part List_Report
import { QueryTypes } from 'sequelize';
import db from '../db';
import { writeDetailLog } from '../utils/logs';
import { type Connection } from 'oracledb';
import { isEmpty } from 'lodash';
import { formatNamedParameters } from 'sequelize/lib/sql-string'
import { formatPartNo } from '@common/trim-shared';
import { supplierCodeFormat } from '../utils/convert';
interface Filters {
  FAMILY_CODE?: string;
  PROJECT_CODE?: string;
  TRIGGER_DATA_CAT?: string;
  SUPPLIER_CODE?: string;
  PART_NO?: string;
  BUYER_CODE?: string;
  INACTIVE_F?: string;
  INTERIM_PRICING_F?: string;
  PRICE_F?: string;
  RFQ_EFFECTIVE_FROM?: string;
  RFQ_EFFECTIVE_TO?: string;
  SENT_PIECE_PO_DATE_FROM?: string;
  SENT_PIECE_PO_DATE_TO?: string;
}

const buildConditionsAndReplacements = (filters: Filters) => {
  const conditions: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.FAMILY_CODE) {
    conditions.push("t.FAMILY_CODE = :FAMILY_CODE");
    replacements['FAMILY_CODE'] = filters.FAMILY_CODE;
  }
  if (filters.PROJECT_CODE) {
    conditions.push("t.PROJECT_CODE = :PROJECT_CODE");
    replacements['PROJECT_CODE'] = filters.PROJECT_CODE;
  }
  if (filters.TRIGGER_DATA_CAT) {
    conditions.push("t.TRIGGER_DATA_CAT = :TRIGGER_DATA_CAT");
    replacements['TRIGGER_DATA_CAT'] = filters.TRIGGER_DATA_CAT;
  }
  if (filters.SUPPLIER_CODE) {
    conditions.push("t.SUPPLIER_CODE = :SUPPLIER_CODE");
    replacements['SUPPLIER_CODE'] = filters.SUPPLIER_CODE;
  }
  if (filters.PART_NO) {
    conditions.push("t.PART_NO = :PART_NO");
    replacements['PART_NO'] = filters.PART_NO;
  }
  if (filters.BUYER_CODE) {
    conditions.push("t.BUYER_CODE = :BUYER_CODE");
    replacements['BUYER_CODE'] = filters.BUYER_CODE;
  }
  if (filters.INACTIVE_F !== undefined) {
    conditions.push("t.INACTIVE_F = :INACTIVE_F");
    replacements['INACTIVE_F'] = filters.INACTIVE_F === 'active' ? 'N' : 'Y';
  }
  if (filters.INTERIM_PRICING_F) {
    conditions.push("t.INTERIM_PRICING_F = :INTERIM_PRICING_F");
    replacements['INTERIM_PRICING_F'] = filters.INTERIM_PRICING_F;
  }
  if (filters.PRICE_F) {
    conditions.push("t.PRICE_F = :PRICE_F");
    replacements['PRICE_F'] = filters.PRICE_F;
  }
  if (filters.RFQ_EFFECTIVE_FROM) {
    conditions.push("t.RFQ_EFFECTIVE_FROM >= TO_DATE(:RFQ_EFFECTIVE_FROM, 'DD/MM/YYYY')");
    replacements['RFQ_EFFECTIVE_FROM'] = filters.RFQ_EFFECTIVE_FROM;
  }
  if (filters.RFQ_EFFECTIVE_TO) {
    conditions.push("t.RFQ_EFFECTIVE_FROM <= TO_DATE(:RFQ_EFFECTIVE_TO, 'DD/MM/YYYY')");
    replacements['RFQ_EFFECTIVE_TO'] = filters.RFQ_EFFECTIVE_TO;
  }
  if (filters.SENT_PIECE_PO_DATE_FROM) {
    conditions.push("t.SENT_PIECE_PO_DATE >= TO_DATE(:SENT_PIECE_PO_DATE_FROM, 'DD/MM/YYYY')");
    replacements['SENT_PIECE_PO_DATE_FROM'] = filters.SENT_PIECE_PO_DATE_FROM;
  }
  if (filters.SENT_PIECE_PO_DATE_TO) {
    conditions.push("t.SENT_PIECE_PO_DATE <= TO_DATE(:SENT_PIECE_PO_DATE_TO, 'DD/MM/YYYY')");
    replacements['SENT_PIECE_PO_DATE_TO'] = filters.SENT_PIECE_PO_DATE_TO;
  }

  return { conditions, replacements };
};

const queryData = async (querys: any) => {

  let connection: Connection;
  try {

    const { conditions, replacements } = buildConditionsAndReplacements(querys.query);

    const count = `
      SELECT (OE.COUNT + EXP.COUNT) AS TOTAL_COUNT
      FROM (
          SELECT COUNT(*) AS COUNT
          FROM  
              TB_R_OE_PO t
          LEFT JOIN 
              TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                            AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
                            AND t1.CD = t.TRIGGER_DATA_CAT
          LEFT JOIN 
              TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                            AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
                            AND t2.CD = t.INTERIM_PRICING_F
          ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ) OE, 
      (
          SELECT COUNT(*) AS COUNT
          FROM  
              TB_R_EXP_PO t
          LEFT JOIN 
              TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                            AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
                            AND t1.CD = t.TRIGGER_DATA_CAT
          LEFT JOIN 
              TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                            AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
                            AND t2.CD = t.INTERIM_PRICING_F
          ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ) EXP;`;

    const totalRecords = await db.query<any>(count, {
      replacements,
      type: QueryTypes.SELECT
    });

    const { userId, appId, functionId, moduleId } = querys;
    const total = totalRecords && totalRecords.length ? totalRecords[0].CNT : 0
    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);

    const query = `
      SELECT 
          PROJECT_CODE,
          t.FAMILY_CODE,
          t.TRIGGER_DATA_CAT,
          t.PART_NO,
          t.BUYER_CODE,
          t.LV,
          t.COLOUR_CODE,
          t.DOCK_CODE,
          t.PART_NAME,
          t.SUPPLIER_CODE,
          t.ECI_NO,
          t.INTERIM_PRICING_F,
          t.RFQ_EFFECTIVE_FROM,
          t.TOTAL_PIECE_PRC,
          t.TOTAL_TOOL_PRC,
          t.CURRENCY_CODE,
          t.SENT_PIECE_PO_DATE,
          t.INACTIVE_F,
          t.ABOLITION_DATE,
          t1.VALUE AS PART_CATEGORY,
          t2.VALUE AS PRICE_STATUS, 
          t1.REMARK,
          B.BUYER_NAME 
      FROM 
          TB_R_OE_PO t
      LEFT JOIN 
          TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                        AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
                        AND t1.CD = t.TRIGGER_DATA_CAT
      LEFT JOIN 
          TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                        AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
                        AND t2.CD = t.INTERIM_PRICING_F 
      LEFT JOIN
        TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
       ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
    UNION ALL
    SELECT 
        PROJECT_CODE,
        t.FAMILY_CODE,
        t.TRIGGER_DATA_CAT,
        t.PART_NO,
        t.BUYER_CODE,
        t.LV,
        t.COLOUR_CODE,
        t.DOCK_CODE,
        t.PART_NAME,
        t.SUPPLIER_CODE,
        t.ECI_NO,
        t.INTERIM_PRICING_F,
        t.RFQ_EFFECTIVE_FROM,
        t.TOTAL_PIECE_PRC,
        t.TOTAL_TOOL_PRC,
        t.CURRENCY_CODE,
        t.SENT_PIECE_PO_DATE,
        t.INACTIVE_F,
        t.ABOLITION_DATE,
        t1.VALUE AS PART_CATEGORY,
        t2.VALUE AS PRICE_STATUS, 
        t1.REMARK,
        B.BUYER_NAME
    FROM 
        TB_R_EXP_PO t
    LEFT JOIN 
        TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                      AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
                      AND t1.CD = t.TRIGGER_DATA_CAT
    LEFT JOIN 
        TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                      AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
                      AND t2.CD = t.INTERIM_PRICING_F 
    LEFT JOIN
        TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}`;


    console.log(query);

    connection = (await db.connectionManager.getConnection({ type: 'read' })) as Connection;
    const result = await connection.execute<any>(
      formatNamedParameters(query, replacements, null, 'oracle'), [],
      { resultSet: true }
    );

    return {
      data: {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              const row = await result.resultSet.getRow();
              return {
                done: !row,
                value: sanitizeResultSetRow(row),
              };
            },
          };
        },
        async close() {
          result.resultSet.close().finally(() => {
            db.connectionManager.releaseConnection(connection);
          });
        },
      },
      total
    };

  } catch (error) {
    connection && db.connectionManager.releaseConnection(connection);

    throw error;
  }

};
const sanitizeResultSetRow = (row: any[]): Record<string, any> => {
  if (isEmpty(row)) {
    return row;
  }

  const attributes = [
    'PROJECT_CODE',
    'FAMILY_CODE',
    'TRIGGER_DATA_CAT',
    'PART_NO',
    'BUYER_CODE',
    'LV',
    'COLOUR_CODE',
    'DOCK_CODE',
    'PART_NAME',
    'SUPPLIER_CODE',
    'ECI_NO',
    'INTERIM_PRICING_F',
    'RFQ_EFFECTIVE_FROM',
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC',
    'CURRENCY_CODE',
    'SENT_PIECE_PO_DATE',
    'INACTIVE_F',
    'ABOLITION_DATE',
    'PART_CATEGORY',
    'PRICE_STATUS',
    'REMARK',
    'BUYER_NAME'
  ];
  const numberAttr = [
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC'
  ]
  return attributes.reduce((acc, attr, i) => {
    // 
    let rs = { ...acc, [attr]: row[i] };

    if (attr == 'PART_NO') {
      rs[attr] = formatPartNo(row[i])
    }
    if (attr == 'CURRENT_PART_NO') {
      rs[attr] = formatPartNo(row[i])
    }
    if (attr == 'SUPPLIER_CODE') {
      rs[attr] = supplierCodeFormat(row[i])
    }
    if (attr == 'INACTIVE_F') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Active' : 'Inactive')
    }
    if (attr == 'INTERIM_PRICING_F') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Final' : 'Interim')
    }
    if (numberAttr.includes(attr)) {
      rs[attr] = Number(row[i]);
    }

    return rs;
  }, {});

};

const getDataReport = async (options?: any): Promise<any> => {
  const promises: Promise<any>[] = [queryData(options)];
  const [result] = await Promise.all(promises);
  await writeDetailLog(options.functionId, options.moduleId, 'I', `Ending ${options.functionName} (OE)`, "MSTD0000AINF", 'E', options.appId, options.userId);
  return { total: result.total, data: result.data };
};

export default {
  getDataReport
};
