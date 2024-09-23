// 01 UISS_BS01001_Finished Sourcing Part List_Report_Updated
import sequelize, { QueryTypes } from 'sequelize';
import db from '../db';
import { writeDetailLog } from '../utils/logs';
import { type Connection } from 'oracledb';
import { isEmpty } from 'lodash';
import { formatNamedParameters } from 'sequelize/lib/sql-string'
import { supplierCodeFormat } from '../utils/convert';
import { formatPartNo } from '@common/trim-shared';
interface Filters {
  NAMC_CODE?: string;
  PROJECT_CODE?: string;
  FAMILY_CODE?: string;
  PART_NO?: string;
  STAGE?: string;
  SRC_COMPLETION_DATE_FROM?: string;
  SRC_COMPLETION_DATE_TO?: string;
  SUPPLIER_CODE?: string;
  BUYER_CODE?: string;
  INACTIVE_F?: string;
  ADDED_DATE_FROM?: string;
  ADDED_DATE_TO?: string;
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
  const replacements: Record<string, any> = {};

  if (filters.NAMC_CODE) {
    conditions.push("t.NAMC_CODE = :NAMC_CODE");
    replacements['NAMC_CODE'] = filters.NAMC_CODE;
  }
  if (filters.PROJECT_CODE) {
    conditions.push("t.PROJECT_CODE = :PROJECT_CODE");
    replacements['PROJECT_CODE'] = filters.PROJECT_CODE;
  }
  if (filters.FAMILY_CODE) {
    conditions.push("t.FAMILY_CODE = :FAMILY_CODE");
    replacements['FAMILY_CODE'] = filters.FAMILY_CODE;
  }
  if (filters.PART_NO) {
    conditions.push("t.PART_NO = :PART_NO");
    replacements['PART_NO'] = filters.PART_NO;
  }
  if (filters.STAGE) {
    conditions.push("t.STAGE = :STAGE");
    replacements['STAGE'] = filters.STAGE;
  }
  if (filters.SRC_COMPLETION_DATE_FROM) {
    conditions.push("t.SRC_COMPLETION_DATE >= TO_DATE(:SRC_COMPLETION_DATE_FROM, 'DD/MM/YYYY')");
    replacements['SRC_COMPLETION_DATE_FROM'] = filters.SRC_COMPLETION_DATE_FROM;
  }
  if (filters.SRC_COMPLETION_DATE_TO) {
    conditions.push("t.SRC_COMPLETION_DATE <= TO_DATE(:SRC_COMPLETION_DATE_TO, 'DD/MM/YYYY')");
    replacements['SRC_COMPLETION_DATE_TO'] = filters.SRC_COMPLETION_DATE_TO;
  }
  if (filters.SUPPLIER_CODE) {
    conditions.push("t.SUPPLIER_CODE = :SUPPLIER_CODE");
    replacements['SUPPLIER_CODE'] = filters.SUPPLIER_CODE;
  }
  if (filters.BUYER_CODE) {
    conditions.push("t.BUYER_CODE = :BUYER_CODE");
    replacements['BUYER_CODE'] = filters.BUYER_CODE;
  }
  if (filters.INACTIVE_F) {
    conditions.push("t.INACTIVE_F = :INACTIVE_F");
    replacements['INACTIVE_F'] = filters.INACTIVE_F;
  }
  if (filters.ADDED_DATE_FROM) {
    conditions.push("t.ADDED_DATE >= TO_DATE(:ADDED_DATE_FROM, 'DD/MM/YYYY')");
    replacements['ADDED_DATE_FROM'] = filters.ADDED_DATE_FROM;
  }
  if (filters.ADDED_DATE_TO) {
    conditions.push("t.ADDED_DATE <= TO_DATE(:ADDED_DATE_TO, 'DD/MM/YYYY')");
    replacements['ADDED_DATE_TO'] = filters.ADDED_DATE_TO;
  }

  return { conditions, replacements };
};

const queryData = async (filters: QueryFilters) => {

  let connection: Connection;
  try {

    const { conditions, replacements } = buildConditionsAndReplacements(filters.query);

    const countOE = `
    SELECT COUNT(1) CNT
    FROM TB_R_OE_SO t
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;
    const totalRecordsOE = await db.query<any>(countOE, {
      replacements,
      type: QueryTypes.SELECT
    });

    const countEX = `
    SELECT 
        COUNT(1) CNT
    FROM TB_R_EXP_SO t
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;

    const totalRecordsEX = await db.query<any>(countEX, {
      replacements,
      type: QueryTypes.SELECT
    });



    const { userId, appId, functionId, moduleId } = filters;
    const total = (totalRecordsOE && totalRecordsOE.length ? totalRecordsOE[0].CNT : 0) + (totalRecordsEX && totalRecordsEX.length ? totalRecordsEX[0].CNT : 0)

    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);


    const queryOE = `
    SELECT
        t1.VALUE AS MC_CODE, 
        t.NAMC_CODE, 
        t.PROJECT_CODE, 
        t.FAMILY_CODE, 
        t.PART_NO, 
        t.LV, 
        t.CURRENT_PART_NO,
        t.PART_NAME, 
        t.BUYER_CODE, 
        t.SUPPLIER_CODE, 
        t2.VALUE AS STAGE, 
        t3.VALUE AS TRIGGER_TYPE,
        TO_CHAR(t.PART_RELEASE_DATE, 'dd/mm/yyyy') AS PART_RELEASE_DATE, 
        t.TOTAL_PIECE_PRC, 
        t.TOTAL_TOOL_PRC, 
        t.CURRENCY_CODE, 
        TO_CHAR(t.ENG_REQ_SRC_DUE_DATE, 'dd/mm/yyyy') AS ENG_REQ_SRC_DUE_DATE,
        TO_CHAR(t.SRC_COMPLETION_DATE, 'dd/mm/yyyy') AS SRC_COMPLETION_DATE, 
        TO_CHAR(t.ADDED_DATE, 'dd/mm/yyyy') AS ADDED_DATE, 
        t.INACTIVE_F, 
        TO_CHAR(t.ABOLITION_DATE, 'dd/mm/yyyy') AS ABOLITION_DATE, 
        t4.VALUE AS PART_CATEGORY,
        B.BUYER_NAME,
        1 INDX
    FROM 
        TB_R_OE_SO t
    LEFT JOIN 
        TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                       AND t1.SUB_CATEGORY = 'MC_CODE' 
                       AND t1.CD = t.NAMC_CODE
    LEFT JOIN 
        TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                       AND t2.SUB_CATEGORY = 'STAGE' 
                       AND t2.CD = t.STAGE
    LEFT JOIN 
        TB_M_SYSTEM t3 ON t3.CATEGORY = 'REPORT_CRITERIA' 
                       AND t3.SUB_CATEGORY = 'TRIGGER' 
                       AND t3.CD = t.TRIGGER_TYPE
    LEFT JOIN 
        TB_M_SYSTEM t4 ON t4.CATEGORY = 'REPORT_CRITERIA' 
                       AND t4.SUB_CATEGORY = 'PART_CATEGORY' 
                       AND t4.CD = t.TRIGGER_DATA_CAT
    LEFT JOIN
        TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;

    const queryEX = `
    SELECT  
        t1.VALUE AS MC_CODE, 
        t.NAMC_CODE, 
        t.PROJECT_CODE, 
        t.FAMILY_CODE, 
        t.PART_NO, 
        t.LV, 
        t.CURRENT_PART_NO,
        t.PART_NAME, 
        t.BUYER_CODE, 
        t.SUPPLIER_CODE, 
        t2.VALUE AS STAGE, 
        t3.VALUE AS TRIGGER_TYPE,
        TO_CHAR(t.PART_RELEASE_DATE, 'dd/mm/yyyy') AS PART_RELEASE_DATE, 
        NULL TOTAL_PIECE_PRC, 
        NULL TOTAL_TOOL_PRC, 
        NULL CURRENCY_CODE, 
        TO_CHAR(t.ENG_REQ_SRC_DUE_DATE, 'dd/mm/yyyy') AS ENG_REQ_SRC_DUE_DATE,
        TO_CHAR(t.SRC_COMPLETION_DATE, 'dd/mm/yyyy') AS SRC_COMPLETION_DATE, 
        TO_CHAR(t.ADDED_DATE, 'dd/mm/yyyy') AS ADDED_DATE, 
        t.INACTIVE_F, 
        TO_CHAR(t.ABOLITION_DATE, 'dd/mm/yyyy') AS ABOLITION_DATE, 
        t4.VALUE AS PART_CATEGORY,
        B.BUYER_NAME,
        2 INDX 
    FROM 
        TB_R_EXP_SO t
    LEFT JOIN 
        TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
                       AND t1.SUB_CATEGORY = 'MC_CODE' 
                       AND t1.CD = t.NAMC_CODE
    LEFT JOIN 
        TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
                       AND t2.SUB_CATEGORY = 'STAGE' 
                       AND t2.CD = t.STAGE
    LEFT JOIN 
        TB_M_SYSTEM t3 ON t3.CATEGORY = 'REPORT_CRITERIA' 
                       AND t3.SUB_CATEGORY = 'TRIGGER' 
                       AND t3.CD = t.TRIGGER_TYPE
    LEFT JOIN 
        TB_M_SYSTEM t4 ON t4.CATEGORY = 'REPORT_CRITERIA' 
                       AND t4.SUB_CATEGORY = 'PART_CATEGORY' 
                       AND t4.CD = t.TRIGGER_DATA_CAT
    LEFT JOIN
        TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
    ORDER BY INDX, NAMC_CODE ASC, FAMILY_CODE ASC, PROJECT_CODE ASC, PART_NO ASC, LV ASC, SUPPLIER_CODE ASC, TRIGGER_TYPE ASC
  `;
    console.info(formatNamedParameters(`${queryOE} UNION ALL ${queryEX}`, replacements, null, 'oracle'))
    connection = (await db.connectionManager.getConnection({ type: 'read' })) as Connection;
    const result = await connection.execute<any>(
      formatNamedParameters(`${queryOE} UNION ALL ${queryEX}`, replacements, null, 'oracle'), [],
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
  }
  catch (error) {
    connection && db.connectionManager.releaseConnection(connection);

    throw error;
  }

};
const sanitizeResultSetRow = (row: any[]): Record<string, any> => {
  if (isEmpty(row)) {
    return row;
  }

  const attributes = [
    'MC_CODE',
    'NAMC_CODE',
    'PROJECT_CODE',
    'FAMILY_CODE',
    'PART_NO',
    'LV',
    'CURRENT_PART_NO',
    'PART_NAME',
    'BUYER_CODE',
    'SUPPLIER_CODE',
    'STAGE',
    'TRIGGER_TYPE',
    'PART_RELEASE_DATE',
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC',
    'CURRENCY_CODE',
    'ENG_REQ_SRC_DUE_DATE',
    'SRC_COMPLETION_DATE',
    'ADDED_DATE',
    'INACTIVE_F',
    'ABOLITION_DATE',
    'PART_CATEGORY',
    'BUYER_NAME',

  ];
  const numberAttr = [    
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC'   
  ]
  // return attributes.reduce((acc, attr, i) => ({ ...acc, [attr]: row[i] }), {});
  return attributes.reduce((acc, attr, i) => {
    // 
    let rs = { ...acc, [attr]: row[i] } ;

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
    if (numberAttr.includes(attr)){
      rs[attr] = Number(row[i]);
    }
    
    return rs;
  }, {});
};
const getDataReport = async (queryFilters: QueryFilters): Promise<any> => {
  const { query } = queryFilters;
  const promises: Promise<any>[] = [queryData(queryFilters)];
  const [result] = await Promise.all(promises);

  await writeDetailLog(queryFilters.functionId, queryFilters.moduleId, 'I', `Ending ${queryFilters.functionName}`, "MSTD0000AINF", 'E', queryFilters.appId, queryFilters.userId);


  return { total: result.total, data: result.data };

};

export default {
  getDataReport,

};
