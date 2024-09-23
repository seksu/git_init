// 06 UISS_BS01006_Price History_Report
import { QueryTypes } from 'sequelize';
import db from '../db';
import { writeDetailLog } from '../utils/logs';
import { type Connection } from 'oracledb';
import { isEmpty } from 'lodash';
import { formatNamedParameters } from 'sequelize/lib/sql-string'
import { formatPartNo } from '@common/trim-shared';
import { supplierCodeFormat } from '../utils/convert';

import q from './pricehistory.query'
import TBMSystem from '../models/tb-m-system.model';

// interface Filters {
//   FAMILY_CODE?: string;
//   PROJECT_CODE?: string;
//   TRIGGER_DATA_CAT?: string;
//   SUPPLIER_CODE?: string;
//   PART_NO?: string;
//   DOCK_CODE?: string;
//   COLOUR_CODE?: string;
//   BUYER_CODE?: string;
//   INTERIM_PRICING_F?: string;
//   PRICE_F?: string;
//   COST_VARIANCE_REASON_CODE?: string;
//   RFQ_EFFECTIVE_FROM?: string;
//   RFQ_EFFECTIVE_TO?: string;
//   SENT_PIECE_PO_DATE_FROM?: string;
//   SENT_PIECE_PO_DATE_TO?: string;
// }

// interface ReasonCodeModel {
//   DETAIL_PRICE_CODE: string;
//   DETAIL_PRICE: number;
// }

// interface ReasonCodeFilters {
//   PARTS_CAT?: string;
//   PART_NO?: string;
//   NAMC_CODE?: string;
//   SUPPLIER_CODE?: string;
//   SUPPLIER_PLANT_CODE?: string;
//   DOCK_CODE?: string;
//   COLOUR_CODE?: string;
//   PO_REVISION_NO?: string;
//   DETAIL_PRICE_CAT: string;
//   REASON_CODE?: string;
// }

// const buildConditionsAndReplacements = (filters: Filters) => {
//   const conditions: string[] = [];
//   const replacements: Record<string, any> = {};

//   if (filters.FAMILY_CODE) {
//     conditions.push("B.FAMILY_CODE = :FAMILY_CODE");
//     replacements['FAMILY_CODE'] = filters.FAMILY_CODE;
//   }
//   if (filters.PROJECT_CODE) {
//     conditions.push("B.PROJECT_CODE = :PROJECT_CODE");
//     replacements['PROJECT_CODE'] = filters.PROJECT_CODE;
//   }
//   if (filters.TRIGGER_DATA_CAT) {
//     conditions.push("A.PARTS_CAT = :TRIGGER_DATA_CAT");
//     replacements['TRIGGER_DATA_CAT'] = filters.TRIGGER_DATA_CAT;
//   }
//   if (filters.SUPPLIER_CODE) {
//     conditions.push("A.SUPPLIER_CODE = :SUPPLIER_CODE");
//     replacements['SUPPLIER_CODE'] = filters.SUPPLIER_CODE;
//   }
//   if (filters.PART_NO) {
//     conditions.push("A.PART_NO = :PART_NO");
//     replacements['PART_NO'] = filters.PART_NO;
//   }
//   if (filters.DOCK_CODE) {
//     conditions.push("A.DOCK_CODE = :DOCK_CODE");
//     replacements['DOCK_CODE'] = filters.DOCK_CODE;
//   }
//   if (filters.COLOUR_CODE) {
//     conditions.push("A.COLOUR_CODE = :COLOUR_CODE");
//     replacements['COLOUR_CODE'] = filters.COLOUR_CODE;
//   }
//   if (filters.BUYER_CODE) {
//     conditions.push("A.BUYER_CODE = :BUYER_CODE");
//     replacements['BUYER_CODE'] = filters.BUYER_CODE;
//   }
//   if (filters.INTERIM_PRICING_F) {
//     conditions.push("B.INTERIM_PRICING_F = :INTERIM_PRICING_F");
//     replacements['INTERIM_PRICING_F'] = filters.INTERIM_PRICING_F;
//   }
//   if (filters.PRICE_F) {
//     conditions.push("A.PRICE_F = :PRICE_F");
//     replacements['PRICE_F'] = filters.PRICE_F;
//   }
//   if (filters.COST_VARIANCE_REASON_CODE) {
//     conditions.push("A.COST_VARIANCE_REASON_CODE = :COST_VARIANCE_REASON_CODE");
//     replacements['COST_VARIANCE_REASON_CODE'] = filters.COST_VARIANCE_REASON_CODE;
//   }
//   if (filters.RFQ_EFFECTIVE_FROM) {
//     conditions.push("A.RFQ_EFFECTIVE_FROM >= TO_DATE(:RFQ_EFFECTIVE_FROM, 'DD/MM/YYYY')");
//     replacements['RFQ_EFFECTIVE_FROM'] = filters.RFQ_EFFECTIVE_FROM;
//   }
//   if (filters.RFQ_EFFECTIVE_TO) {
//     conditions.push("A.RFQ_EFFECTIVE_FROM <= TO_DATE(:RFQ_EFFECTIVE_TO, 'DD/MM/YYYY')");
//     replacements['RFQ_EFFECTIVE_TO'] = filters.RFQ_EFFECTIVE_TO;
//   }
//   if (filters.SENT_PIECE_PO_DATE_FROM) {
//     conditions.push("A.SENT_PIECE_PO_DATE >= TO_DATE(:SENT_PIECE_PO_DATE_FROM, 'DD/MM/YYYY')");
//     replacements['SENT_PIECE_PO_DATE_FROM'] = filters.SENT_PIECE_PO_DATE_FROM;
//   }
//   if (filters.SENT_PIECE_PO_DATE_TO) {
//     conditions.push("A.SENT_PIECE_PO_DATE <= TO_DATE(:SENT_PIECE_PO_DATE_TO, 'DD/MM/YYYY')");
//     replacements['SENT_PIECE_PO_DATE_TO'] = filters.SENT_PIECE_PO_DATE_TO;
//   }

//   return { conditions, replacements };
// };


const queryReasonCode = async (querys: any) => {

  const partCate = await TBMSystem.findOne({
    where: {
      category: "REPORT_CRITERIA",
      subCategory: "PART_CATEGORY",
      cd: querys.query?.TRIGGER_DATA_CAT || ''
    }
  });
  console.log('-------------------')
  const { sqlReasonCode: query, criteria: replacements } = q.getQueryStatement(partCate?.remark, querys.query);
  console.info(query)
  const currencyList = await db.query<any>(query, {
    replacements,
    type: QueryTypes.SELECT
  });

  return currencyList
}

const queryData = async (querys: any) => {

  const partCate = await TBMSystem.findOne({
    where: {
      category: "REPORT_CRITERIA",
      subCategory: "PART_CATEGORY",
      cd: querys.query?.TRIGGER_DATA_CAT || ''
    }
  });

  let connection: Connection;

  // const { conditions, replacements } = buildConditionsAndReplacements(querys.query);
  // const query = getQueryStatement(querys);

  const { sqlCount, sqlData, criteria: replacements } = q.getQueryStatement(partCate?.remark, querys.query);

  const subQuery = `
    (
      SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
          'CAT' VALUE s.DETAIL_PRICE_CAT,
          'CODE' VALUE s.DETAIL_PRICE_CODE,
          'PRICE' VALUE s.DETAIL_PRICE
          )
      )
      FROM    TB_R_PRICE_REASON s
      WHERE   A.PARTS_CAT             = s.PARTS_CAT AND
              A.PART_NO               = s.PART_NO AND
              A.NAMC_CODE             = s.NAMC_CODE AND
              A.SUPPLIER_CODE         = s.SUPPLIER_CODE AND
              A.SUPPLIER_PLANT_CODE   = s.SUPPLIER_PLANT_CODE AND
              A.DOCK_CODE             = s.DOCK_CODE AND
              A.COLOUR_CODE           = s.COLOUR_CODE AND
              A.PO_REVISION_NO        = s.PO_REVISION_NO
    )
  `

  const query = sqlData.replace("'##REPLACE##'", subQuery);

  const totalRecords = await db.query<any>(sqlCount, {
    replacements,
    type: QueryTypes.SELECT
  });

  const { userId, appId, functionId, moduleId } = querys;
  const total = totalRecords && totalRecords.length ? totalRecords[0].CNT : 0;
  await writeDetailLog(functionId, moduleId, 'I', `Found ${total} records`, "-", 'P', appId, userId);




  console.info(formatNamedParameters(query, replacements, null, 'oracle'));
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
};

const sanitizeResultSetRow = (row: any[]): Record<string, any> => {
  if (isEmpty(row)) {
    return row;
  }

  const attributes = [
    'PROJECT_CODE',
    'FAMILY_CODE',
    'PARTS_CAT',
    'PART_NO',
    'LV',
    'PART_NAME',
    'COLOUR_CODE',
    'DOCK_CODE',
    'ECI_NO',
    'BUYER_CODE',
    'SUPPLIER_CODE',
    'PRICING_REASON_CODE',
    'EFFECTIVE_FROM_DATE',
    'SENT_PIECE_PO_DATE',
    'PREVIOUS_PRICE',
    'UNIT_PRICE',
    'TOTAL_TOOL_PRC',
    'SPECIAL_PKG',
    'PO_REVISION_NO',
    'TOTAL_PRICE_IMPACT',
    'CURRENCY_CODE',
    'NAMC_CODE',
    'HANDLING',
    'TRANSPORTATION',
    'SUPPLIER_PLANT_CODE',
    'PRICE_STATUS',
    'PART_CATEGORY',
    'REMARK',
    'BUYER_NAME',
    'DTL'
  ];

  const numberAttr = [
    'PREVIOUS_PRICE',
    'UNIT_PRICE',
    'TOTAL_TOOL_PRC',
    'SPECIAL_PKG',
    'TOTAL_PRICE_IMPACT',
    'HANDLING',
    'TRANSPORTATION'

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
    if (attr == 'DTL') {
      rs['detailList'] = JSON.parse(row[i]);

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
  await writeDetailLog(options.functionId, options.moduleId, 'I', `Ending ${options.functionName}`, "MSTD0000AINF", 'E', options.appId, options.userId);
  return { total: result.total, data: result.data };

};


export default {
  getDataReport,
  queryReasonCode,

};
