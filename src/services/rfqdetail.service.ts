// 04 UISS_BS01004_RFQ Detail OE Pricing_Report + 05 UISS_BS01005_RFQ Detail EXP Pricing_Report
import { QueryTypes } from 'sequelize';
import db from '../db';
import { writeDetailLog } from '../utils/logs';
import { type Connection } from 'oracledb';
import { isEmpty } from 'lodash';
import { formatPartNo } from '@common/trim-shared';
import { supplierCodeFormat } from '../utils/convert';
import { formatNamedParameters } from 'sequelize/lib/sql-string'
interface Filters {
  FAMILY_CODE?: string;
  PROJECT_CODE?: string;
  TRIGGER_DATA_CAT?: string;
  SUPPLIER_CODE?: string;
  PART_NO?: string;
  BUYER_CODE?: string;
  INACTIVE_F?: string;
  DOMESTIC_IMPORT?: string;
  MATERIAL_AND_PURCHASE_PART?: string;
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
  if (filters.INACTIVE_F) {
    conditions.push("t.INACTIVE_F = :INACTIVE_F");
    replacements['INACTIVE_F'] = filters.INACTIVE_F;
  }
  if (filters.DOMESTIC_IMPORT) {
    conditions.push("t.DOMESTIC_IMPORT = :DOMESTIC_IMPORT");
    replacements['DOMESTIC_IMPORT'] = filters.DOMESTIC_IMPORT;
  }
  if (filters.MATERIAL_AND_PURCHASE_PART) {
    conditions.push("t.MATERIAL_PURCHASE = :MATERIAL_AND_PURCHASE_PART");
    replacements['MATERIAL_AND_PURCHASE_PART'] = filters.MATERIAL_AND_PURCHASE_PART;
  }
  if (filters.INTERIM_PRICING_F) {
    conditions.push("t.INTERIM_PRICING_F = :INTERIM_PRICING_F");
    replacements['INTERIM_PRICING_F'] = filters.INTERIM_PRICING_F;
  }
  if (filters.PRICE_F) {
    conditions.push("t.PRICE_STATUS = :PRICE_F");
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

const queryCurrency = async (querys: any) => {
  const { conditions, replacements } = buildConditionsAndReplacements(querys.query);


  const sql = `SELECT  
          DISTINCT t_sub.CURRENCY_CODE
  FROM    TB_R_EXP_PO t
  INNER   JOIN
          TB_R_EXP_PO_SUB t_sub
  ON      t.PROJECT_CODE = t_sub.PROJECT_CODE 
          AND  t.PART_NO = t_sub.PART_NO 
          AND  t.SUPPLIER_CODE = t_sub.SUPPLIER_CODE 
          AND  t.NAMC_CODE = t_sub.NAMC_CODE 
          AND  t.RFQ_CAT = t_sub.RFQ_CAT 
          AND  t.RFQ_NO = t_sub.RFQ_NO 
          AND  t.REV_NO = t_sub.REV_NO 
          AND  t.DOCK_CODE = t_sub.DOCK_CODE
									
  ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
`
  const currencyList = await db.query<any>(sql, {
    replacements,
    type: QueryTypes.SELECT
  });

  return currencyList
}

const queryCurrencyOe = async (querys: any) => {
  const { conditions, replacements } = buildConditionsAndReplacements(querys.query);


  const sql = `SELECT  
          DISTINCT t_sub.CURRENCY_CODE
  FROM    TB_R_EXP_PO t
  INNER   JOIN
          TB_R_OE_PO_SUB t_sub
  ON      t.PROJECT_CODE = t_sub.PROJECT_CODE 
          AND  t.PART_NO = t_sub.PART_NO 
          AND  t.SUPPLIER_CODE = t_sub.SUPPLIER_CODE 
          AND  t.NAMC_CODE = t_sub.NAMC_CODE 
          AND  t.RFQ_CAT = t_sub.RFQ_CAT 
          AND  t.RFQ_NO = t_sub.RFQ_NO 
          AND  t.REV_NO = t_sub.REV_NO 
          AND  t.DOCK_CODE = t_sub.DOCK_CODE
									
  ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
`
  const currencyList = await db.query<any>(sql, {
    replacements,
    type: QueryTypes.SELECT
  });

  return currencyList
}
/// report 4
const queryOE = async (querys: any) => {

  let connection: Connection;
  try {

    const { conditions, replacements } = buildConditionsAndReplacements(querys.query);
    const count = `
    SELECT 
        COUNT(1) CNT
    FROM TB_R_OE_PO t
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;

    const totalRecords = await db.query<any>(count, {
      replacements,
      type: QueryTypes.SELECT
    });

    const { userId, appId, functionId, moduleId } = querys;
    const total = totalRecords && totalRecords.length ? totalRecords[0].CNT : 0
    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);

    const query = `
 SELECT 
        t.FAMILY_CODE,
        t.PROJECT_CODE,
        t.TRIGGER_DATA_CAT,
      --  t.BUYER_CODE,
        t.BUYER_CODE || ' - ' || b.BUYER_NAME as "BUYER_CODE",
        t.PART_NO,
        t.LV,
        t.COLOUR_CODE,
        t.PART_NAME,
       -- t.SUPPLIER_CODE,
        case 
            when SUBSTR(t.SUPPLIER_CODE, 5) is not null
            then SUBSTR(t.SUPPLIER_CODE, 1, 4) || '-' || SUBSTR(t.SUPPLIER_CODE, 5)
            else SUBSTR(t.SUPPLIER_CODE, 1, 4)
         end as SUPPLIER_CODE,
        t.ECI_NO,
        t.VOLUME,
        t.INTERIM_PRICING_F,
        TO_CHAR(t.RFQ_EFFECTIVE_FROM, 'dd/mm/yyyy') AS RFQ_EFFECTIVE_FROM,
        TO_CHAR(t.SENT_PIECE_PO_DATE, 'dd/mm/yyyy') AS SENT_PIECE_PO_DATE,
        t.MAT_DOM,
        t.PS_PART_DOM,
        t.PROCESS,
        t.SPECIAL_PKG,
        t.OH,
        t.MARK_UP,
        t.PRICE_LESS_TOOL,
        t.TOOLING_PC,
        t.CURRENCY_CODE,
        t.INACTIVE_F,
        TO_CHAR(t.ABOLITION_DATE, 'dd/mm/yyyy') AS ABOLITION_DATE,
        t.DOCK_CODE,
        t1.VALUE AS PART_CATEGORY,
        t2.VALUE AS PRICE_STATUS,
        t.NAMC_CODE,
        t.RFQ_CAT,
        t.RFQ_NO,
        t.REV_NO,
        t.TOTAL_PIECE_PRC,
        t.TOTAL_TOOL_PRC,
        t1.REMARK,
            (
        SELECT 
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'MAT_IMP' VALUE t_sub.MAT_IMP, 
                    'CURRENCY_CODE' VALUE t_sub.CURRENCY_CODE, 
                    'PART_IMP' VALUE t_sub.PART_IMP
                )
            )
        FROM TB_R_OE_PO_SUB t_sub
        WHERE  t.PROJECT_CODE = t_sub.PROJECT_CODE 
          AND  t.PART_NO = t_sub.PART_NO 
          AND  t.SUPPLIER_CODE = t_sub.SUPPLIER_CODE 
          AND  t.NAMC_CODE = t_sub.NAMC_CODE 
          AND  t.RFQ_CAT = t_sub.RFQ_CAT 
          AND  t.RFQ_NO = t_sub.RFQ_NO 
          AND  t.REV_NO = t_sub.REV_NO 
          AND  t.DOCK_CODE = t_sub.DOCK_CODE
    ) AS DTL
    FROM TB_R_OE_PO t
     LEFT JOIN tb_m_buyer b
     ON t.BUYER_CODE = b.BUYER_CD
    LEFT JOIN TB_M_SYSTEM t1 
      ON t1.CATEGORY = 'REPORT_CRITERIA' 
      AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
      AND t1.CD = t.TRIGGER_DATA_CAT
    LEFT JOIN TB_M_SYSTEM t2 
      ON t2.CATEGORY = 'REPORT_CRITERIA' 
      AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
      AND t2.CD = t.INTERIM_PRICING_F
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
    ORDER BY FAMILY_CODE ASC, PROJECT_CODE ASC, PART_CATEGORY ASC, PART_NO ASC, LV ASC, SUPPLIER_CODE ASC, PRICE_STATUS ASC, RFQ_EFFECTIVE_FROM ASC 
  `;

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
                value: sanitizeResultSetRowOE(row),
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
const sanitizeResultSetRowOE = (row: any[]): Record<string, any> => {
  if (isEmpty(row)) {
    return row;
  }

  const attributes = [
    'FAMILY_CODE',
    'PROJECT_CODE',
    'TRIGGER_DATA_CAT',
    'BUYER_CODE',
    'PART_NO',
    'LV',
    'COLOUR_CODE',
    'PART_NAME',
    'SUPPLIER_CODE',
    'ECI_NO',
    'VOLUME',
    'INTERIM_PRICING_F',
    'RFQ_EFFECTIVE_FROM',
    'SENT_PIECE_PO_DATE',
    'MAT_DOM',
    'PS_PART_DOM',
    'PROCESS',
    'SPECIAL_PKG',
    'OH',
    'MARK_UP',
    'PRICE_LESS_TOOL',
    'TOOLING_PC',
    'CURRENCY_CODE',
    'INACTIVE_F',
    'ABOLITION_DATE',
    'DOCK_CODE',
    'PART_CATEGORY',
    'PRICE_STATUS',
    'NAMC_CODE',
    'RFQ_CAT',
    'RFQ_NO',
    'REV_NO',
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC',
    'REMARK',
    'DTL'

  ];

  return attributes.reduce((acc, attr, i) => {
    // 
    let rs = { ...acc, [attr]: row[i] };

    if (attr == 'PART_NO' || attr == 'CURRENT_PART_NO') {
      rs[attr] = formatPartNo(row[i])
    }
    // if (attr == 'SUPPLIER_CODE') {
    //   rs[attr] = supplierCodeFormat(row[i])
    // }
    if (attr == 'INACTIVE_F') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Active' : 'Inactive')
    }
    if (attr == 'INTERIM_PRICING_F') {
      rs[attr] = (!row[i] || row[i] == 'N' ? 'Final' : 'Interim')
    }

    if(attr == 'DTL'){
      rs['detailList'] = JSON.parse(row[i]);
    }

    if (attr == 'VOLUME') {
      if(row[i] == 0){
        rs[attr] = "0 "
      }else{
        rs[attr] = row[i]
      }
    }

    return rs;
  }, {});
};
/// report 5
const queryEX = async (querys: any) => {
  let connection: Connection;
  try {
    const { conditions, replacements } = buildConditionsAndReplacements(querys.query);

    const count = `
    SELECT 
        COUNT(1) CNT
    FROM TB_R_EXP_PO t
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;

    const totalRecords = await db.query<any>(count, {
      replacements,
      type: QueryTypes.SELECT
    });

    const { userId, appId, functionId, moduleId } = querys;
    const total = totalRecords && totalRecords.length ? totalRecords[0].CNT : 0
    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);

    const query = `
     SELECT 
    t.PROJECT_CODE,
    t.FAMILY_CODE,
    t.TRIGGER_DATA_CAT,
    -- t.BUYER_CODE,
    t.BUYER_CODE || ' - ' || b.BUYER_NAME as "BUYER_CODE",
    t.PART_NO,
    t.LV,
    t.COLOUR_CODE,
    t.PART_NAME,
    t.SUPPLIER_CODE,
    t.ECI_NO,
    t.VOLUME,
    t.INTERIM_PRICING_F,
    t.RFQ_EFFECTIVE_FROM,
    t.SENT_PIECE_PO_DATE,
    t.MAT_DOM,
    t.PS_PART_DOM,
    t.PROCESS,
    t.SPECIAL_PKG,
    t.OH,
    t.MARK_UP,
    t.PRICE_LESS_TOOL,
    t.TOOLING_PC,
    t.CURRENCY_CODE,
    t.INACTIVE_F,
    t.ABOLITION_DATE,
    t.DOCK_CODE,
    t1.VALUE AS PART_CATEGORY,
    t2.VALUE AS PRICE_STATUS,
    t.NAMC_CODE,
    t.RFQ_CAT,
    t.RFQ_NO,
    t.REV_NO,
    t.TOTAL_PIECE_PRC,
    t.TOTAL_TOOL_PRC,
    t.HANDLING,
    t.TRANSPORTATION,
    (
        SELECT 
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'MAT_IMP' VALUE t_sub.MAT_IMP, 
                    'CURRENCY_CODE' VALUE t_sub.CURRENCY_CODE, 
                    'PART_IMP' VALUE t_sub.PART_IMP
                )
            )
        FROM TB_R_EXP_PO_SUB t_sub
        WHERE  t.PROJECT_CODE = t_sub.PROJECT_CODE 
          AND  t.PART_NO = t_sub.PART_NO 
          AND  t.SUPPLIER_CODE = t_sub.SUPPLIER_CODE 
          AND  t.NAMC_CODE = t_sub.NAMC_CODE 
          AND  t.RFQ_CAT = t_sub.RFQ_CAT 
          AND  t.RFQ_NO = t_sub.RFQ_NO 
          AND  t.REV_NO = t_sub.REV_NO 
          AND  t.DOCK_CODE = t_sub.DOCK_CODE
    ) AS DTL
FROM 
    TB_R_EXP_PO t 
         LEFT JOIN tb_m_buyer b
     ON t.BUYER_CODE = b.BUYER_CD
LEFT JOIN 
    TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                  AND t1.SUB_CATEGORY = 'PART_CATEGORY' 
                  AND t1.CD = t.TRIGGER_DATA_CAT
LEFT JOIN 
    TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                  AND t2.SUB_CATEGORY = 'PRICE_STATUS' 
                  AND t2.CD = t.INTERIM_PRICING_F 
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
    ORDER BY FAMILY_CODE ASC, PROJECT_CODE ASC, PART_CATEGORY ASC, PART_NO ASC, LV ASC, SUPPLIER_CODE ASC, PRICE_STATUS ASC, RFQ_EFFECTIVE_FROM ASC
    `

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
                value: sanitizeResultSetRowEX(row),
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
const sanitizeResultSetRowEX = (row: any[]): Record<string, any> => {
  if (isEmpty(row)) {
    return row;
  }

  const attributes = [
    'PROJECT_CODE',
    'FAMILY_CODE',
    'TRIGGER_DATA_CAT',
    'BUYER_CODE',
    'PART_NO',
    'LV',
    'COLOUR_CODE',
    'PART_NAME',
    'SUPPLIER_CODE',
    'ECI_NO',
    'VOLUME',
    'INTERIM_PRICING_F',
    'RFQ_EFFECTIVE_FROM',
    'SENT_PIECE_PO_DATE',
    'MAT_DOM',
    'PS_PART_DOM',
    'PROCESS',
    'SPECIAL_PKG',
    'OH',
    'MARK_UP',
    'PRICE_LESS_TOOL',
    'TOOLING_PC',
    'CURRENCY_CODE',
    'INACTIVE_F',
    'ABOLITION_DATE',
    'DOCK_CODE',
    'PART_CATEGORY',
    'PRICE_STATUS',
    'NAMC_CODE',
    'RFQ_CAT',
    'RFQ_NO',
    'REV_NO',
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC',
    'HANDLING',
    'TRANSPORTATION',
    'DTL'

  ];

  return attributes.reduce((acc, attr, i) => {
    // 
    let rs = { ...acc, [attr]: row[i] };

    if (attr == 'PART_NO' || attr == 'CURRENT_PART_NO') {
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

    if (attr == 'VOLUME') {
      if(row[i] == 0){
        rs[attr] = "0 "
      }else{
        rs[attr] = row[i]
      }
    }

    if (attr == 'TOTAL_PIECE_PRC') {
      if(row[i] == null){
        rs[attr] = "0.00"
      }else{
        rs[attr] = row[i]
      }
    }

    if (attr == 'TOTAL_TOOL_PRC') {
      if(row[i] == null){
        rs[attr] = "0.001"
      }else{
        rs[attr] = row[i]
      }
    }
    
    if(attr == 'DTL'){
      rs['detailList'] = JSON.parse(row[i]);
    }

    return rs;
  }, {});
};
const getDataReportOE = async (options?: any): Promise<any> => {
  const promises: Promise<any>[] = [queryOE(options)];
  const [result] = await Promise.all(promises);
  await writeDetailLog(options.functionId, options.moduleId, 'I', `Ending ${options.functionName} (OE)`, "MSTD0000AINF", 'E', options.appId, options.userId);
  return { total: result.total, data: result.data };
};

const getDataReportEX = async (options?: any): Promise<any> => {
  const promises: Promise<any>[] = [queryEX(options)];
  const [result] = await Promise.all(promises);
  await writeDetailLog(options.functionId, options.moduleId, 'I', `Ending ${options.functionName} (EX)`, "MSTD0000AINF", 'E', options.appId, options.userId);
  return { total: result.total, data: result.data };

};

export default {
  getDataReportOE,
  getDataReportEX,
  queryCurrency,
  queryCurrencyOe
};
