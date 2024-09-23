// 08 UISS_BS01008_Finish_OE_Export_Pricing_Part_List_Report_OK
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
  DOCK_CODE?: string;
  COLOR_CODE?: string;
  BUYER_CODE?: string;
  INACTIVE_F?: string;
  INTERIM_PRICING_F?: string;
  PRICE_F?: string;
  RFQ_EFFECTIVE_FROM?: string;
  RFQ_EFFECTIVE_TO?: string;
  SENT_PIECE_PO_DATE_FROM?: string;
  SENT_PIECE_PO_DATE_TO?: string;
}

interface QueryFilters {
  query: Filters;
  userId: string;
  appId: number;
  functionId: string;
  moduleId: string;
  functionName: string;
}

const buildConditionsAndReplacements = (filters: Filters) => {
  const conditions: string[] = [];
  const conditionsSub: string[] = [];
  const replacements: Record<string, any> = {};

  if (filters.PROJECT_CODE) {
    conditions.push("(a.PROJECT_CODE = :PROJECT_CODE OR b.PROJECT_CODE = :PROJECT_CODE)");
    conditionsSub.push("(t.PROJECT_CODE = :PROJECT_CODE)");
    replacements['PROJECT_CODE'] = filters.PROJECT_CODE;
  }
  if (filters.FAMILY_CODE) {
    conditions.push("(a.FAMILY_CODE = :FAMILY_CODE OR b.FAMILY_CODE = :FAMILY_CODE)");
    conditionsSub.push("(t.FAMILY_CODE = :FAMILY_CODE)");
    replacements['FAMILY_CODE'] = filters.FAMILY_CODE;
  }

  if (filters.PART_NO) {
    conditions.push("(a.PART_NO = :PART_NO OR b.PART_NO = :PART_NO)");
    conditionsSub.push("(t.PART_NO = :PART_NO)");
    replacements['PART_NO'] = filters.PART_NO;
  }
  if (filters.SUPPLIER_CODE) {
    conditions.push("(a.SUPPLIER_CODE = :SUPPLIER_CODE OR b.SUPPLIER_CODE = :SUPPLIER_CODE)");
    conditionsSub.push("(t.SUPPLIER_CODE = :SUPPLIER_CODE)");
    replacements['SUPPLIER_CODE'] = filters.SUPPLIER_CODE;
  }

  if (filters.INTERIM_PRICING_F) {
    conditions.push("(a.INTERIM_PRICING_F = :INTERIM_PRICING_F OR b.INTERIM_PRICING_F = :INTERIM_PRICING_F)");
    conditionsSub.push("(t.INTERIM_PRICING_F = :INTERIM_PRICING_F)");
    replacements['INTERIM_PRICING_F'] = filters.INTERIM_PRICING_F;
  }

  if (filters.DOCK_CODE) {
    conditions.push("(a.DOCK_CODE = :DOCK_CODE OR b.DOCK_CODE = :DOCK_CODE)");
    conditionsSub.push("(t.DOCK_CODE = :DOCK_CODE)");
    replacements['DOCK_CODE'] = filters.DOCK_CODE;
  }
  if (filters.COLOR_CODE) {
    conditions.push("(a.COLOUR_CODE = :COLOR_CODE OR b.COLOUR_CODE = :COLOR_CODE)");
    conditionsSub.push("(t.COLOUR_CODE = :COLOUR_CODE)");
    replacements['COLOR_CODE'] = filters.COLOR_CODE;
  }
  if (filters.RFQ_EFFECTIVE_FROM) {
    conditions.push("a.RFQ_EFFECTIVE_FROM >= TO_DATE(:RFQ_EFFECTIVE_FROM, 'DD/MM/YYYY')");
    conditionsSub.push("(t.RFQ_EFFECTIVE_FROM >= TO_DATE(:RFQ_EFFECTIVE_FROM, 'DD/MM/YYYY') ");
    replacements['RFQ_EFFECTIVE_FROM'] = filters.RFQ_EFFECTIVE_FROM;
  }
  if (filters.RFQ_EFFECTIVE_TO) {
    conditions.push("a.RFQ_EFFECTIVE_FROM <= TO_DATE(:RFQ_EFFECTIVE_TO, 'DD/MM/YYYY')");
    conditionsSub.push("(t.RFQ_EFFECTIVE_FROM <= TO_DATE(:RFQ_EFFECTIVE_TO, 'DD/MM/YYYY')");
    replacements['RFQ_EFFECTIVE_TO'] = filters.RFQ_EFFECTIVE_TO;
  }
  if (filters.SENT_PIECE_PO_DATE_FROM) {
    conditions.push("a.SENT_PIECE_PO_DATE >= TO_DATE(:SENT_PIECE_PO_DATE_FROM, 'DD/MM/YYYY')");
    conditionsSub.push("(t.SENT_PIECE_PO_DATE >= TO_DATE(:SENT_PIECE_PO_DATE_FROM, 'DD/MM/YYYY')");
    replacements['SENT_PIECE_PO_DATE_FROM'] = filters.SENT_PIECE_PO_DATE_FROM;
  }
  if (filters.SENT_PIECE_PO_DATE_TO) {
    conditions.push("a.SENT_PIECE_PO_DATE <= TO_DATE(:SENT_PIECE_PO_DATE_TO, 'DD/MM/YYYY')");
    conditionsSub.push("(t.SENT_PIECE_PO_DATE <= TO_DATE(:SENT_PIECE_PO_DATE_TO, 'DD/MM/YYYY')");
    replacements['SENT_PIECE_PO_DATE_TO'] = filters.SENT_PIECE_PO_DATE_TO;
  }

  return { conditions, conditionsSub, replacements };
};

const groupDataOEandEX = async (filters: QueryFilters) => {


  let connection: Connection;
  try {

    const { conditions, conditionsSub, replacements } = buildConditionsAndReplacements(filters.query);

    const count = `SELECT 
        COUNT(1) CNT
    FROM 
          (
              SELECT 
                  ROW_NUMBER() OVER (PARTITION BY t.FAMILY_CODE, PROJECT_CODE, t.PART_NO, t.SUPPLIER_CODE, t2.VALUE ORDER BY t.RFQ_EFFECTIVE_FROM) rn,
                  t.FAMILY_CODE,
                  PROJECT_CODE,
                  t.PART_NO,
                  t.COLOUR_CODE,
                  t.DOCK_CODE,
                  t.PART_NAME,
                  t.SUPPLIER_CODE,
                  t.INTERIM_PRICING_F,
                  t.RFQ_EFFECTIVE_FROM RFQ_EFFECTIVE_FROM_OE,
                  t.TOTAL_PIECE_PRC TOTAL_PIECE_PRC_OE,
                  t.TOTAL_TOOL_PRC TOTAL_TOOL_PRC_OE,
                  t.CURRENCY_CODE CURRENCY_CODE_OE,
                  t.SENT_PIECE_PO_DATE SENT_PIECE_PO_DATE_OE,
                  t.INACTIVE_F INACTIVE_F_OE,
                  t.ABOLITION_DATE ABOLITION_DATE_OE,
                  t1.VALUE AS PART_CATEGORY,
                  t2.VALUE AS PRICE_STATUS,
                  t1.REMARK
              FROM 
                  TB_R_OE_PO t
              LEFT JOIN TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                                            AND t1.SUB_CATEGORY = 'PART_CATEGORY'
                                            AND t1.CD = t.TRIGGER_DATA_CAT
                  LEFT JOIN TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA'
                                            AND t2.SUB_CATEGORY = 'PRICE_STATUS'
                                            AND t2.CD = t.INTERIM_PRICING_F
              ${conditionsSub.length ? 'WHERE ' + conditionsSub.join(' AND ') : ''}
          ) a
      FULL OUTER JOIN 
          (
              SELECT 
                  ROW_NUMBER() OVER (PARTITION BY t.FAMILY_CODE, PROJECT_CODE, t.PART_NO, t.SUPPLIER_CODE, t2.VALUE ORDER BY t.RFQ_EFFECTIVE_FROM) rn,
                  t.FAMILY_CODE,
                  PROJECT_CODE,
                  t.PART_NO,
                  t.COLOUR_CODE,
                  t.DOCK_CODE,
                  t.PART_NAME,
                  t.SUPPLIER_CODE,
                  t.INTERIM_PRICING_F,
                  t.RFQ_EFFECTIVE_FROM RFQ_EFFECTIVE_FROM_EXP,
                  t.TOTAL_PIECE_PRC TOTAL_PIECE_PRC_EXP,
                  t.TOTAL_TOOL_PRC TOTAL_TOOL_PRC_EXP,
                  t.CURRENCY_CODE CURRENCY_CODE_EXP,
                  t.SENT_PIECE_PO_DATE SENT_PIECE_PO_DATE_EXP,
                  t.INACTIVE_F INACTIVE_F_EXP,
                  t.ABOLITION_DATE ABOLITION_DATE_EXP,
                  t1.VALUE AS PART_CATEGORY,
                  t2.VALUE AS PRICE_STATUS,
                  t1.REMARK
              FROM 
                  TB_R_EXP_PO t
              LEFT JOIN TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                                            AND t1.SUB_CATEGORY = 'PART_CATEGORY'
                                            AND t1.CD = t.TRIGGER_DATA_CAT
              LEFT JOIN TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA'
                                        AND t2.SUB_CATEGORY = 'PRICE_STATUS'
                                        AND t2.CD = t.INTERIM_PRICING_F
              ${conditionsSub.length ? 'WHERE ' + conditionsSub.join(' AND ') : ''}
          ) b
          ON a.FAMILY_CODE = b.FAMILY_CODE
          AND a.PROJECT_CODE = b.PROJECT_CODE
          AND a.PART_NO = b.PART_NO
          AND a.COLOUR_CODE = b.COLOUR_CODE
          AND a.DOCK_CODE = b.DOCK_CODE
          AND a.PART_NAME = b.PART_NAME
          AND a.SUPPLIER_CODE = b.SUPPLIER_CODE
          AND a.INTERIM_PRICING_F = b.INTERIM_PRICING_F
          AND a.PRICE_STATUS = b.PRICE_STATUS
          AND a.rn = b.rn
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `
    const totalRecords = await db.query<any>(count, {
      replacements,
      type: QueryTypes.SELECT
    });
    const { userId, appId, functionId, moduleId } = filters;
    const total = totalRecords && totalRecords.length ? totalRecords[0].CNT : 0
    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);


    const query = `
    SELECT 
          NVL(a.FAMILY_CODE, b.FAMILY_CODE) FAMILY_CODE,
          NVL(a.PROJECT_CODE, b.PROJECT_CODE) PROJECT_CODE,
          NVL(a.PART_NO, b.PART_NO) PART_NO,
          NVL(a.COLOUR_CODE, b.COLOUR_CODE) COLOUR_CODE,
          NVL(a.DOCK_CODE, b.DOCK_CODE) DOCK_CODE,
          NVL(a.PART_NAME, b.PART_NAME) PART_NAME,
          NVL(a.SUPPLIER_CODE, b.SUPPLIER_CODE) SUPPLIER_CODE,
          NVL(a.INTERIM_PRICING_F, b.INTERIM_PRICING_F) INTERIM_PRICING_F,
          NVL(a.PRICE_STATUS, b.PRICE_STATUS) PRICE_STATUS,
          a.RFQ_EFFECTIVE_FROM_OE,
          a.TOTAL_PIECE_PRC_OE,
          a.TOTAL_TOOL_PRC_OE,
          a.CURRENCY_CODE_OE,
          a.SENT_PIECE_PO_DATE_OE,
          a.INACTIVE_F_OE,
          a.ABOLITION_DATE_OE,
          b.RFQ_EFFECTIVE_FROM_EXP,
          b.TOTAL_PIECE_PRC_EXP,
          b.TOTAL_TOOL_PRC_EXP,
          b.CURRENCY_CODE_EXP,
          b.SENT_PIECE_PO_DATE_EXP,
          b.INACTIVE_F_EXP,
          b.ABOLITION_DATE_EXP,
          NVL(a.REMARK, b.REMARK) REMARK,
          NVL(a.BUYER_CODE, b.BUYER_CODE) BUYER_CODE,
          NVL(a.BUYER_NAME, b.BUYER_NAME) BUYER_NAME
      FROM 
          (
              SELECT 
                  ROW_NUMBER() OVER (PARTITION BY t.FAMILY_CODE, PROJECT_CODE, t.PART_NO, t.SUPPLIER_CODE, t2.VALUE ORDER BY t.RFQ_EFFECTIVE_FROM) rn,
                  t.FAMILY_CODE,
                  PROJECT_CODE,
                  t.PART_NO,
                  t.COLOUR_CODE,
                  t.DOCK_CODE,
                  t.PART_NAME,
                  t.SUPPLIER_CODE,
                  t.INTERIM_PRICING_F,
                  t.RFQ_EFFECTIVE_FROM RFQ_EFFECTIVE_FROM_OE,
                  t.TOTAL_PIECE_PRC TOTAL_PIECE_PRC_OE,
                  t.TOTAL_TOOL_PRC TOTAL_TOOL_PRC_OE,
                  t.CURRENCY_CODE CURRENCY_CODE_OE,
                  t.SENT_PIECE_PO_DATE SENT_PIECE_PO_DATE_OE,
                  t.INACTIVE_F INACTIVE_F_OE,
                  t.ABOLITION_DATE ABOLITION_DATE_OE,
                  NULL RFQ_EFFECTIVE_FROM_EXP,
                  NULL TOTAL_PIECE_PRC_EXP,
                  NULL TOTAL_TOOL_PRC_EXP,
                  NULL CURRENCY_CODE_EXP,
                  NULL SENT_PIECE_PO_DATE_EXP,
                  NULL INACTIVE_F_EXP,
                  NULL ABOLITION_DATE_EXP,
                  t1.VALUE AS PART_CATEGORY,
                  t2.VALUE AS PRICE_STATUS,
                  t1.REMARK,
                  t.BUYER_CODE,
                  B.BUYER_NAME
              FROM 
                  TB_R_OE_PO t
                  LEFT JOIN TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                                            AND t1.SUB_CATEGORY = 'PART_CATEGORY'
                                            AND t1.CD = t.TRIGGER_DATA_CAT
                  LEFT JOIN TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA'
                                            AND t2.SUB_CATEGORY = 'PRICE_STATUS'
                                            AND t2.CD = t.INTERIM_PRICING_F
                  LEFT JOIN
                    TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
              ${conditionsSub.length ? 'WHERE ' + conditionsSub.join(' AND ') : ''}
          ) a
      FULL OUTER JOIN 
          (
              SELECT 
                  ROW_NUMBER() OVER (PARTITION BY t.FAMILY_CODE, PROJECT_CODE, t.PART_NO, t.SUPPLIER_CODE, t2.VALUE ORDER BY t.RFQ_EFFECTIVE_FROM) rn,
                  t.FAMILY_CODE,
                  PROJECT_CODE,
                  t.PART_NO,
                  t.COLOUR_CODE,
                  t.DOCK_CODE,
                  t.PART_NAME,
                  t.SUPPLIER_CODE,
                  t.INTERIM_PRICING_F,
                  NULL RFQ_EFFECTIVE_FROM_OE,
                  NULL TOTAL_PIECE_PRC_OE,
                  NULL TOTAL_TOOL_PRC_OE,
                  NULL CURRENCY_CODE_OE,
                  NULL SENT_PIECE_PO_DATE_OE,
                  NULL INACTIVE_F_OE,
                  NULL ABOLITION_DATE_OE,
                  t.RFQ_EFFECTIVE_FROM RFQ_EFFECTIVE_FROM_EXP,
                  t.TOTAL_PIECE_PRC TOTAL_PIECE_PRC_EXP,
                  t.TOTAL_TOOL_PRC TOTAL_TOOL_PRC_EXP,
                  t.CURRENCY_CODE CURRENCY_CODE_EXP,
                  t.SENT_PIECE_PO_DATE SENT_PIECE_PO_DATE_EXP,
                  t.INACTIVE_F INACTIVE_F_EXP,
                  t.ABOLITION_DATE ABOLITION_DATE_EXP,
                  t1.VALUE AS PART_CATEGORY,
                  t2.VALUE AS PRICE_STATUS,
                  t1.REMARK,
                  t.BUYER_CODE,
                  B.BUYER_NAME
              FROM 
                  TB_R_EXP_PO t
                  LEFT JOIN TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA'
                                            AND t1.SUB_CATEGORY = 'PART_CATEGORY'
                                            AND t1.CD = t.TRIGGER_DATA_CAT
                  LEFT JOIN TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA'
                                            AND t2.SUB_CATEGORY = 'PRICE_STATUS'
                                            AND t2.CD = t.INTERIM_PRICING_F
                  LEFT JOIN
                    TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
              ${conditionsSub.length ? 'WHERE ' + conditionsSub.join(' AND ') : ''}
          ) b
          ON a.FAMILY_CODE = b.FAMILY_CODE
          AND a.PROJECT_CODE = b.PROJECT_CODE
          AND a.PART_NO = b.PART_NO
          AND a.COLOUR_CODE = b.COLOUR_CODE
          AND a.DOCK_CODE = b.DOCK_CODE
          AND a.PART_NAME = b.PART_NAME
          AND a.SUPPLIER_CODE = b.SUPPLIER_CODE
          AND a.INTERIM_PRICING_F = b.INTERIM_PRICING_F
          AND a.PRICE_STATUS = b.PRICE_STATUS
          AND a.rn = b.rn
      ORDER BY 
          a.FAMILY_CODE ASC,
          a.PROJECT_CODE ASC,
          a.PART_NO ASC,
          a.SUPPLIER_CODE ASC,
          a.PRICE_STATUS ASC,
          a.RFQ_EFFECTIVE_FROM_OE ASC,
          b.RFQ_EFFECTIVE_FROM_EXP ASC
    `;

    console.info(formatNamedParameters(query, replacements, null, 'oracle'))
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
    'FAMILY_CODE',
    'PROJECT_CODE',
    'PART_NO',
    'COLOUR_CODE',
    'DOCK_CODE',
    'PART_NAME',
    'SUPPLIER_CODE',
    'INTERIM_PRICING_F',
    'PRICE_STATUS',
    'RFQ_EFFECTIVE_FROM_OE',
    'TOTAL_PIECE_PRC_OE',
    'TOTAL_TOOL_PRC_OE',
    'CURRENCY_CODE_OE',
    'SENT_PIECE_PO_DATE_OE',
    'INACTIVE_F_OE',
    'ABOLITION_DATE_OE',
    'RFQ_EFFECTIVE_FROM_EXP',
    'TOTAL_PIECE_PRC_EXP',
    'TOTAL_TOOL_PRC_EXP',
    'CURRENCY_CODE_EXP',
    'SENT_PIECE_PO_DATE_EXP',
    'INACTIVE_F_EXP',
    'ABOLITION_DATE_EXP',
    'REMARK',
    'BUYER_CODE',
    'BUYER_NAME'
  ];

  const numberAttr = [
    'TOTAL_PIECE_PRC_OE',
    'TOTAL_TOOL_PRC_OE',
    'TOTAL_PIECE_PRC_EXP',
    'TOTAL_TOOL_PRC_EXP'
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
    if (attr == 'INACTIVE_F_OE' || attr == 'INACTIVE_F_EXP') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Active' : 'Inactive')
    }
    if (attr == 'INTERIM_PRICING_F') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Final' : 'Interim')
    }
    if (numberAttr.includes(attr)){
      rs[attr] = Number(row[i]);
    }

    return rs;
  }, {});
  //return attributes.reduce((acc, attr, i) => ({ ...acc, [attr]: row[i] }), {});
};


const getDataReport = async (queryFilters: QueryFilters): Promise<any> => {

  const promises: Promise<any>[] = [groupDataOEandEX(queryFilters)];
  const [result] = await Promise.all(promises);

  await writeDetailLog(queryFilters.functionId, queryFilters.moduleId, 'I', `Ending ${queryFilters.functionName}`, "MSTD0000AINF", 'E', queryFilters.appId, queryFilters.userId);
  return { total: result.total, data: result.data };
};

export default {
  getDataReport,
};
