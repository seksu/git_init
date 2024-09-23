import _ from "lodash"

const getQueryStatement = (PartCategory: string, querys: any) => {
  // const { conditions, replacements } = buildConditionsAndReplacements(querys.query);


  const { TRIGGER_DATA_CAT: dataCat,
    PROJECT_CODE: projectCode,
    FAMILY_CODE: familyCode,
    PART_NO: partNumber,
    SUPPLIER_CODE: supplierCode,
    INTERIM_PRICING_F: priceStatus,
    BUYER_CODE: buyerCode,
    RFQ_EFFECTIVE_FROM: effectiveDateF,
    RFQ_EFFECTIVE_TO: effectiveDateT,
    SENT_PIECE_PO_DATE_FROM: pricingDateF,
    SENT_PIECE_PO_DATE_TO: pricingDateT,
    DOCK_CODE: dockCode,
    COLOUR_CODE: colourCode,
    PRICE_F: finalPriceStatus,  // should be A or B
    COST_VARIANCE_REASON_CODE: reasonCode,
    DETAIL_PRICE_CAT: detailPriceCat } = querys

  let sql = `SELECT B.PROJECT_CODE, 
    B.FAMILY_CODE, 
    A.PARTS_CAT, 
    A.PART_NO,
    A.LV, 
    A.PART_NAME, 
    A.COLOUR_CODE, 
    A.DOCK_CODE, 
    A.ECI_NO,
    A.BUYER_CODE, 
    CONCAT(A.SUPPLIER_CODE, A.SUPPLIER_PLANT_CODE) SUPPLIER_CODE,
    A.PRICING_REASON_CODE, 
    A.EFFECTIVE_FROM_DATE, 
    A.SENT_PIECE_PO_DATE, 
    A.PREVIOUS_PRICE,
    A.UNIT_PRICE, 
    B.TOTAL_TOOL_PRC, 
    B.SPECIAL_PKG, 
    A.PO_REVISION_NO,
    A.TOTAL_PRICE_IMPACT, 
    A.CURRENCY_CAT, 
    A.NAMC_CODE,
    B.HANDLING,
    B.TRANSPORTATION, 
    A.SUPPLIER_PLANT_CODE, 
    t2.VALUE AS PRICE_STATUS, 
    t1.VALUE AS PARTS_CAT_VALUE, 
    t1.REMARK,
    C.BUYER_NAME,
    '##REPLACE##' DTL
  FROM TB_R_PRICE_HIST A
  LEFT JOIN
        TB_M_BUYER C ON A.BUYER_CODE = C.BUYER_CD
  LEFT JOIN ( `

  let params = {}
  let paramsAll = {}
  let sqlCount = `SELECT COUNT(1) AS COUNT FROM TB_R_PRICE_HIST A  LEFT JOIN ( `;

  let sqlOe = ``, sqlExp = ``

  if (!PartCategory) {
    sqlOe = " SELECT C.PART_NO, C.TRIGGER_DATA_CAT, C.NAMC_CODE, C.SUPPLIER_CODE, C.DOCK_CODE, C.COLOUR_CODE "
      + " , C.RFQ_EFFECTIVE_FROM, C.PO_REVISION_NO, C.PROJECT_CODE, C.FAMILY_CODE, C.BUYER_CODE "
      + " , C.INTERIM_PRICING_F, C.TOTAL_TOOL_PRC, C.SPECIAL_PKG, C.CURRENCY_CODE "
      + " , NULL AS HANDLING, NULL AS TRANSPORTATION "
      + " FROM TB_R_OE_PO C ";
    sqlExp = " UNION ALL SELECT C.PART_NO, C.TRIGGER_DATA_CAT, C.NAMC_CODE, C.SUPPLIER_CODE, C.DOCK_CODE, C.COLOUR_CODE "
      + " , C.RFQ_EFFECTIVE_FROM, C.PO_REVISION_NO, C.PROJECT_CODE, C.FAMILY_CODE, C.BUYER_CODE "
      + " , C.INTERIM_PRICING_F, C.TOTAL_TOOL_PRC, C.SPECIAL_PKG, C.CURRENCY_CODE "
      + " , C.HANDLING, C.TRANSPORTATION "
      + " FROM TB_R_EXP_PO C ";
  }
  else if (PartCategory == 'OE') {

    sqlOe = " SELECT C.PART_NO, C.TRIGGER_DATA_CAT, C.NAMC_CODE, C.SUPPLIER_CODE, C.DOCK_CODE, C.COLOUR_CODE "
      + " , C.RFQ_EFFECTIVE_FROM, C.PO_REVISION_NO, C.PROJECT_CODE, C.FAMILY_CODE, C.BUYER_CODE "
      + " , C.INTERIM_PRICING_F, C.TOTAL_TOOL_PRC, C.SPECIAL_PKG, C.CURRENCY_CODE "
      + " , NULL AS HANDLING, NULL AS TRANSPORTATION "
      + " FROM TB_R_OE_PO C ";
  }
  else if (PartCategory == 'EXP') {
    sqlExp = " SELECT C.PART_NO, C.TRIGGER_DATA_CAT, C.NAMC_CODE, C.SUPPLIER_CODE, C.DOCK_CODE, C.COLOUR_CODE "
      + " , C.RFQ_EFFECTIVE_FROM, C.PO_REVISION_NO, C.PROJECT_CODE, C.FAMILY_CODE, C.BUYER_CODE "
      + " , C.INTERIM_PRICING_F, C.TOTAL_TOOL_PRC, C.SPECIAL_PKG, C.CURRENCY_CODE "
      + " , C.HANDLING, C.TRANSPORTATION "
      + " FROM TB_R_EXP_PO C ";
  }

  let and = "";
  let where = "";
  let where2 = "";
  let wheresup = "";
  let fwhere = "";
  let fwhere2 = "";
  let whereReason = "";
  let paramsSub = {}

  where += " WHERE 1=1 "; //Kaizen2018
  where2 += " WHERE 1=1 "; //Kaizen2018
  and = " AND "; //Kaizen2018

  if (projectCode) {
    where += and;
    where += "B.PROJECT_CODE LIKE :projectCode ";
    wheresup += " AND B2.PROJECT_CODE LIKE :projectCode ";

    where2 += and;
    where2 += "C.PROJECT_CODE LIKE :projectCode ";
    and = " AND ";



  }
  if (familyCode) {
    where += and;
    where += "B.FAMILY_CODE LIKE :familyCode ";
    wheresup += " AND B2.FAMILY_CODE LIKE :familyCode ";

    where2 += and;
    where2 += "C.FAMILY_CODE LIKE :familyCode ";
    and = " AND ";

    params['familyCode'] = `${familyCode}%`
  }
  if (dataCat) {
    where += and;
    where += "A.PARTS_CAT = :dataCat ";
    wheresup += " AND B2.TRIGGER_DATA_CAT = :dataCat ";

    where2 += and;
    where2 += "C.TRIGGER_DATA_CAT = :dataCat ";
    and = " AND ";
    params['dataCat'] = dataCat
  }
  if (partNumber) {
    where += and;
    where += "A.PART_NO LIKE :partNumber ";
    wheresup += " AND B2.PART_NO LIKE :partNumber ";

    where2 += and;
    where2 += "C.PART_NO LIKE :partNumber ";
    and = " AND ";
    params['partNumber'] = `${partNumber}%`

  }
  if (supplierCode) {
    where += and;
    where += "A.SUPPLIER_CODE LIKE :supplierCode ";
    wheresup += " AND B2.SUPPLIER_CODE LIKE :supplierCode ";

    where2 += and;
    where2 += "C.SUPPLIER_CODE LIKE :supplierCode ";
    and = " AND ";

    params['supplierCode'] = `${supplierCode}%`

  }
  if (priceStatus) {
    where += and;
    where += "A.PRICING_REASON_CODE = :priceStatus ";
    wheresup += " AND B2.INTERIM_PRICING_F = :priceStatus ";

    where2 += and;
    where2 += "C.INTERIM_PRICING_F = :priceStatus ";
    and = " AND ";

    params['priceStatus'] = `${priceStatus}`
  }
  if (buyerCode) {
    where += and;
    where += "A.BUYER_CODE LIKE :buyerCode ";
    wheresup += " AND B2.BUYER_CODE LIKE :buyerCode ";

    where2 += and;
    where2 += "C.BUYER_CODE LIKE :buyerCode ";
    and = " AND ";

    params['buyerCode'] = `${buyerCode}%`

  }
  if (effectiveDateF) {
    where += and;
    where += " TRUNC(A.EFFECTIVE_FROM_DATE) >= TO_DATE(:effectiveDateF ,'YYYY-MM-DD') ";
    wheresup += " AND TRUNC(B2.RFQ_EFFECTIVE_FROM) >= TO_DATE(:effectiveDateF ,'YYYY-MM-DD') ";

    where2 += and;
    where2 += " TRUNC(C.RFQ_EFFECTIVE_FROM) >= TO_DATE(:effectiveDateF ,'YYYY-MM-DD') ";
    and = " AND ";
    params['effectiveDateF'] = effectiveDateF
  }
  if (effectiveDateT) {
    where += and;
    where += " TRUNC(A.EFFECTIVE_FROM_DATE) <= TO_DATE(:effectiveDateT ,'YYYY-MM-DD') ";
    wheresup += " AND TRUNC(B2.RFQ_EFFECTIVE_FROM) <= TO_DATE(:effectiveDateT ,'YYYY-MM-DD') ";

    where2 += and;
    where2 += " TRUNC(C.RFQ_EFFECTIVE_FROM) <= TO_DATE(:effectiveDateT ,'YYYY-MM-DD') ";
    and = " AND ";

    params['effectiveDateT'] = effectiveDateT
  }
  if (pricingDateF) {
    where += and;
    where += " TRUNC(A.SENT_PIECE_PO_DATE) >= TO_DATE(:pricingDateF ,'YYYY-MM-DD') ";
    wheresup += " AND TRUNC(B2.SENT_PIECE_PO_DATE) >= TO_DATE(:pricingDateF ,'YYYY-MM-DD') ";

    where2 += and;
    where2 += " TRUNC(C.SENT_PIECE_PO_DATE) >= TO_DATE(:pricingDateF ,'YYYY-MM-DD') ";
    and = " AND ";

    params['pricingDateF'] = pricingDateF
  }
  if (pricingDateT) {
    where += and;
    where += " TRUNC(A.SENT_PIECE_PO_DATE) <= TO_DATE(:pricingDateT ,'YYYY-MM-DD') ";
    wheresup += " AND TRUNC(B2.SENT_PIECE_PO_DATE) <= TO_DATE(:pricingDateT ,'YYYY-MM-DD') ";

    where2 += and;
    where2 += " TRUNC(C.SENT_PIECE_PO_DATE) <= TO_DATE(:pricingDateT ,'YYYY-MM-DD') ";
    and = " AND ";

    params['pricingDateT'] = pricingDateT
  }
  if (dockCode) {
    where += and;
    where += "A.DOCK_CODE = :dockCode ";
    wheresup += " AND B2.DOCK_CODE = :dockCode ";

    where2 += and;
    where2 += "C.DOCK_CODE = :dockCode ";
    and = " AND ";

    params['dockCode'] = dockCode
  }
  if (colourCode) {
    where += and;
    where += "A.COLOUR_CODE = :colourCode ";
    wheresup += " AND B2.COLOUR_CODE = :colourCode ";

    where2 += and;
    where2 += "C.COLOUR_CODE = :colourCode ";
    and = " AND ";

    params['colourCode'] = colourCode
  }


  if (finalPriceStatus) {
    let funct = "";
    //TB_R_OE_PO
    if (sqlOe) {
      fwhere2 += and;
      funct = "";

      if (finalPriceStatus == "A") {
        funct = "MIN";
      }
      if (finalPriceStatus == "B") {
        funct = "MAX";
      }

      fwhere2 += " (C.RFQ_EFFECTIVE_FROM = (SELECT " + funct + "(RFQ_EFFECTIVE_FROM) FROM TB_R_OE_PO B2 "
        + " WHERE B2.PART_NO = C.PART_NO "
        + wheresup + " )) ";

      paramsSub = { paramsSub, ...params };
    }

    //TB_R_EXP_PO
    if (sqlExp) {
      fwhere += and;
      funct = "";

      if (finalPriceStatus == "A") {
        funct = "MIN";
      }
      if (finalPriceStatus == "B") {
        funct = "MAX";
      }

      fwhere += " (C.RFQ_EFFECTIVE_FROM = (SELECT " + funct + "(RFQ_EFFECTIVE_FROM) FROM TB_R_EXP_PO B2 "
        + " WHERE B2.PART_NO = C.PART_NO "
        + wheresup + " )) ";

      paramsSub = { paramsSub, ...params };
    }

  }
  // End of where

  if (sqlOe) {
    sqlOe += where2;
    sqlOe += fwhere2;
    sql += sqlOe;
    sqlCount += sqlOe;


    paramsAll = { ...paramsAll, ...paramsSub, ...params }

    // paramsAll.push(...paramsOe);

  }

  if (sqlExp) {
    sqlExp += where2;
    sqlExp += fwhere;
    sql += sqlExp;
    sqlCount += sqlExp;

    paramsAll = { ...paramsAll, ...paramsSub, ...params }

  }

  sql += " ) B ON (B.PART_NO = A.PART_NO  AND B.TRIGGER_DATA_CAT = A.PARTS_CAT "
    + " AND B.NAMC_CODE = A.NAMC_CODE  AND B.SUPPLIER_CODE = A.SUPPLIER_CODE || A.SUPPLIER_PLANT_CODE "
    + " AND B.DOCK_CODE = A.DOCK_CODE  AND B.COLOUR_CODE = A.COLOUR_CODE "
    + " AND TRUNC(B.RFQ_EFFECTIVE_FROM) = TRUNC(A.EFFECTIVE_FROM_DATE) "
    + " AND CASE WHEN B.PO_REVISION_NO IS NULL THEN '-' ELSE B.PO_REVISION_NO END = A.PO_REVISION_NO) "
    + " LEFT JOIN TB_M_SYSTEM t1 ON (t1.CATEGORY = 'REPORT_CRITERIA' AND t1.SUB_CATEGORY = 'PART_CATEGORY' "
    + " AND t1.CD = A.PARTS_CAT) "
    + " LEFT JOIN TB_M_SYSTEM t2 ON (t2.CATEGORY = 'REPORT_CRITERIA' "
    + " AND t2.SUB_CATEGORY = 'PRICE_STATUS' AND t2.CD = A.PRICING_REASON_CODE) ";
  sql += where;

  sqlCount += " ) B ON (B.PART_NO = A.PART_NO  AND B.TRIGGER_DATA_CAT = A.PARTS_CAT "
    + " AND B.NAMC_CODE = A.NAMC_CODE  AND B.SUPPLIER_CODE = A.SUPPLIER_CODE || A.SUPPLIER_PLANT_CODE "
    + " AND B.DOCK_CODE = A.DOCK_CODE  AND B.COLOUR_CODE = A.COLOUR_CODE "
    + " AND TRUNC(B.RFQ_EFFECTIVE_FROM) = TRUNC(A.EFFECTIVE_FROM_DATE) "
    + " AND CASE WHEN B.PO_REVISION_NO IS NULL THEN '-' ELSE B.PO_REVISION_NO END = A.PO_REVISION_NO) "
    + " LEFT JOIN TB_M_SYSTEM t1 ON (t1.CATEGORY = 'REPORT_CRITERIA' AND t1.SUB_CATEGORY = 'PART_CATEGORY' "
    + " AND t1.CD = A.PARTS_CAT) "
    + " LEFT JOIN TB_M_SYSTEM t2 ON (t2.CATEGORY = 'REPORT_CRITERIA' "
    + " AND t2.SUB_CATEGORY = 'PRICE_STATUS' AND t2.CD = A.PRICING_REASON_CODE) ";
  sqlCount += where;

  if (where) whereReason = " AND ";
  else whereReason = " WHERE ";


  paramsAll = { ...paramsAll, ...params };

  // let paramsHead = {};

  let sqlReasonCode = "SELECT DISTINCT PR.DETAIL_PRICE_CODE, M.VALUE AS DETAIL_PRICE_DESC FROM TB_R_PRICE_REASON PR "
    + " LEFT JOIN TB_M_SYSTEM M ON M.CATEGORY = 'REPORT_CRITERIA' AND M.SUB_CATEGORY = 'DETAIL_REASON_CODE' AND M.CD = PR.DETAIL_PRICE_CODE WHERE EXISTS ( "
    + sql
    + whereReason
    + " A.PARTS_CAT = PR.PARTS_CAT "
    + " AND A.PART_NO = PR.PART_NO "
    + " AND A.NAMC_CODE = PR.NAMC_CODE "
    + " AND A.SUPPLIER_CODE = PR.SUPPLIER_CODE "
    + " AND A.SUPPLIER_PLANT_CODE = PR.SUPPLIER_PLANT_CODE "
    + " AND A.DOCK_CODE = PR.DOCK_CODE "
    + " AND A.COLOUR_CODE = PR.COLOUR_CODE "
    + " AND A.PO_REVISION_NO = PR.PO_REVISION_NO )";


  if (reasonCode) {

    if (Array.isArray(reasonCode)) {
      const list: string = _.map(reasonCode, (obj) => { return `'${obj}'` }).join(',')
      sqlReasonCode += ` AND PR.DETAIL_PRICE_CODE IN (${list}) `;
    }
    else {
      sqlReasonCode += " AND PR.DETAIL_PRICE_CODE = :reasonCode ";
      paramsAll['reasonCode'] = reasonCode;
    }
  }
  if (detailPriceCat) {
    sqlReasonCode += " AND PR.DETAIL_PRICE_CAT = :detailPriceCat ";
    paramsAll['detailPriceCat'] = detailPriceCat;
  }


  sqlReasonCode += " ORDER BY PR.DETAIL_PRICE_CODE";

  sql += " ORDER BY FAMILY_CODE ASC, PROJECT_CODE ASC, PARTS_CAT_VALUE ASC, PART_NO ASC, LV ASC, PART_NAME ASC, COLOUR_CODE ASC, EFFECTIVE_FROM_DATE ASC ";


  // console.log(sqlReasonCode);
  // console.log('--------------------------------')
  // console.log(sql);

  return { sqlReasonCode, sqlData: sql, sqlCount, criteria: paramsAll }
}

export default {
  getQueryStatement
};
