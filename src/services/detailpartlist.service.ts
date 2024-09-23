// 02 UISS_BS01002_Detail Sourcing Part List_Report
import { json, QueryTypes } from 'sequelize';
import db from '../db';
import { writeDetailLog } from '../utils/logs';
import { type Connection } from 'oracledb';
import { isEmpty, isNil } from 'lodash';
import { formatNamedParameters } from 'sequelize/lib/sql-string'
import { formatPartNo } from '@common/trim-shared';
import { supplierCodeFormat } from '../utils/convert';
interface Filters {
  NAMC_CODE?: string;
  PROJECT_CODE?: string;
  FAMILY_CODE?: string;
  PART_NO?: string;
  STAGE?: string;
  SUPPLIER_CODE?: string;
  BUYER_CODE?: string;
  INACTIVE_F?: string;
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
  if (filters.SUPPLIER_CODE) {
    conditions.push("t.SUPPLIER_CODE = :SUPPLIER_CODE");
    replacements['SUPPLIER_CODE'] = filters.SUPPLIER_CODE;
  }
  if (filters.BUYER_CODE) {
    conditions.push("t.BUYER_CODE = :BUYER_CODE");
    replacements['BUYER_CODE'] = filters.BUYER_CODE;
  }
  if (filters.INACTIVE_F !== undefined) {
    conditions.push("t.INACTIVE_F = :INACTIVE_F");
    replacements['INACTIVE_F'] = filters.INACTIVE_F === 'active' ? 'N' : 'Y';
  }

  return { conditions, replacements };
};

const queryCurrency = async (querys: any) => {
  const { conditions, replacements } = buildConditionsAndReplacements(querys.query);


  const sql = `SELECT  
          DISTINCT s.CURRENCY_CODE
  FROM    TB_R_OE_SO t
  INNER   JOIN
          TB_R_OE_SO_SUB s
  ON      t.NAMC_CODE = s.NAMC_CODE and
          t.PROJECT_CODE = s.PROJECT_CODE and 
          t.PART_NO = s.PART_NO and
          t.SUPPLIER_CODE = s.SUPPLIER_CODE and        
          t.RFQ_CAT = s.RFQ_CAT and 
          t.RFQ_NO = s.RFQ_NO and 
          t.REV_NO = s.REV_NO   									
  ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
`
  const currencyList = await db.query<any>(sql, {
    replacements,
    type: QueryTypes.SELECT
  });

  return currencyList
}


const queryData = async (querys: any) => {

  let connection: Connection;

  try {

    const { conditions, replacements } = buildConditionsAndReplacements(querys.query);


    const countOE = `SELECT COUNT(1) CNT
    FROM TB_R_OE_SO t    									
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `
    const totalRecordsOE = await db.query<any>(countOE, {
      replacements,
      type: QueryTypes.SELECT
    });

    const countEX = `SELECT	COUNT(1) CNT											
    FROM TB_R_EXP_SO	t
    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
  `;
    const totalRecordsEX = await db.query<any>(countEX, {
      replacements,
      type: QueryTypes.SELECT
    });


    const { userId, appId, functionId, moduleId } = querys;
    const total = (totalRecordsOE && totalRecordsOE.length ? totalRecordsOE[0].CNT : 0) + (totalRecordsEX && totalRecordsEX.length ? totalRecordsEX[0].CNT : 0)

    await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);

    // //Load OE Sub List
    // const OeSoSubList = await queryOeSoSub(querys)
    // console.log(OeSoSubList)
    const subQuery = `
    (
            SELECT JSON_ARRAYAGG(
                 JSON_OBJECT(
                'CURRENCY_CODE' VALUE s.CURRENCY_CODE,
                'MAT_IMP' VALUE s.MAT_IMP,
                'PART_IMP' VALUE s.PART_IMP
                )
            )
            FROM    tb_r_oe_so_sub s
            where   t.NAMC_CODE = s.NAMC_CODE and
                    t.PROJECT_CODE = s.PROJECT_CODE and 
                    t.PART_NO = s.PART_NO and
                    t.SUPPLIER_CODE = s.SUPPLIER_CODE and        
                    t.RFQ_CAT = s.RFQ_CAT and 
                    t.RFQ_NO = s.RFQ_NO and 
                    t.REV_NO = s.REV_NO
    ) DTL
    `
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
        t.TOOLING_PC, 
        t.RFQ_CAT, 
        t.RFQ_NO, 
        t.REV_NO, 
        t.PER_VEHICLE_PIECES, 
        t.VOLUME, 
        t.MAT_DOM, 
        t.PS_PART_DOM, 
        t.PROCESS, 
        t.SPECIAL_PKG, 
        t.OH, 
        t.MARK_UP, 
        t.PRICE_LESS_TOOL, 
        t4.VALUE AS PART_CATEGORY,
        ${subQuery},
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
      NULL TOOLING_PC, 
      NULL RFQ_CAT, 
      NULL RFQ_NO, 
      NULL REV_NO, 
      NULL PER_VEHICLE_PIECES, 
      NULL VOLUME, 
      NULL MAT_DOM, 
      NULL PS_PART_DOM, 
      NULL PROCESS, 
      NULL SPECIAL_PKG, 
      NULL OH, 
      NULL MARK_UP, 
      NULL PRICE_LESS_TOOL, 
      t4.VALUE AS PART_CATEGORY,
      NULL AS DTL,
      B.BUYER_NAME,
      2 INDX 
    FROM 
    TB_R_EXP_SO t 
    LEFT JOIN TB_M_SYSTEM t1 ON t1.CATEGORY = 'REPORT_CRITERIA' 
      AND t1.SUB_CATEGORY = 'MC_CODE' 
      AND t1.CD = t.NAMC_CODE 
    LEFT JOIN TB_M_SYSTEM t2 ON t2.CATEGORY = 'REPORT_CRITERIA' 
      AND t2.SUB_CATEGORY = 'STAGE' 
      AND t2.CD = t.STAGE 
    LEFT JOIN TB_M_SYSTEM t3 ON t3.CATEGORY = 'REPORT_CRITERIA' 
      AND t3.SUB_CATEGORY = 'TRIGGER' 
      AND t3.CD = t.TRIGGER_TYPE 
    LEFT JOIN TB_M_SYSTEM t4 ON t4.CATEGORY = 'REPORT_CRITERIA' 
      AND t4.SUB_CATEGORY = 'PART_CATEGORY' 
      AND t4.CD = t.TRIGGER_DATA_CAT
    LEFT JOIN
        TB_M_BUYER B ON t.BUYER_CODE = B.BUYER_CD

    ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}

    ORDER BY INDX, NAMC_CODE ASC, FAMILY_CODE ASC, PROJECT_CODE ASC, PART_NO ASC, LV ASC, SUPPLIER_CODE ASC, TRIGGER_TYPE ASC
    `
    console.info(formatNamedParameters(`${queryOE} UNION ALL ${queryEX} `, replacements, null, 'oracle'));
    connection = (await db.connectionManager.getConnection({ type: 'read' })) as Connection;
    const result = await connection.execute<any>(
      formatNamedParameters(`${queryOE} UNION ALL ${queryEX} `, replacements, null, 'oracle'), [],
      { resultSet: true }
    );

    return {
      data: {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              // console.time("X")
              const row = await result.resultSet.getRow();
              // console.timeEnd("X")
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
    'TOOLING_PC',
    'RFQ_CAT',
    'RFQ_NO',
    'REV_NO',
    'PER_VEHICLE_PIECES',
    'VOLUME',
    'MAT_DOM',
    'PS_PART_DOM',
    'PROCESS',
    'SPECIAL_PKG',
    'OH',
    'MARK_UP',
    'PRICE_LESS_TOOL',
    'PART_CATEGORY',
    'DTL',
    'BUYER_NAME',
  ];

  const numberAttr = [    
    'TOTAL_PIECE_PRC',
    'TOTAL_TOOL_PRC',  
    'TOOLING_PC',   
    'PER_VEHICLE_PIECES',
    'VOLUME',
    'MAT_DOM',
    'PS_PART_DOM',
    'PROCESS',
    'SPECIAL_PKG',
    'OH',
    'MARK_UP',
    'PRICE_LESS_TOOL'    
  ]
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
    if(attr == 'DTL'){
      rs['detailList'] = JSON.parse(row[i]);
      console.log(rs['detailList'])
    }
    if (numberAttr.includes(attr)){
      rs[attr] = Number(row[i]);
    }


    return rs;
  }, {});

};
const getDataReport = async (options?: any): Promise<any> => {
  const promises: Promise<any>[] = [queryData(options)];
  const [result] = await Promise.all(promises);
  await writeDetailLog(options.functionId, options.moduleId, 'I', `Ending ${options.functionName}`, "MSTD0000AINF", 'E', options.appId, options.userId);
  return { total: result.total, data: result.data };
};



export default {
  getDataReport,
  queryCurrency
};
