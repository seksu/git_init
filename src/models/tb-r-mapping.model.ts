import { Model, Table, PrimaryKey, Column, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'TB_R_MAPPING',
  modelName: 'tb_r_mapping',
  //timestamps: false,
})
export class TBRMapping extends Model {
  @Column({ field: 'REC_ID', })
  recordId: string


  @Column({ field: 'PROJ_CODE', })
  projectCode: string
  @Column({ field: 'CFC', })
  carFamilyCode: string
  @Column({ field: 'SRC_PART_NO', })
  sourcePartNo: string
  @Column({ field: 'PART_NO', })
  partNo: string
  @Column({ field: 'MC_CODE', })
  mcCode: string
  @Column({ field: 'B1_PART_NO', })
  b1PartNo: string
  @Column({ field: 'B1_PART_NAME', })
  b1PartName: string
  @Column({ field: 'B1_CPP', })
  b1CPP: string
  @Column({ field: 'B1_21', })
  b121: string
  @Column({ field: 'B1_INDEX_CODE', })
  b1IndexCode: string
  @Column({ field: 'B1_PARENT_PART_NO', })
  b1ParentPartNo: string
  @Column({ field: 'B1_ECI', })
  b1ECI: string
  @Column({ field: 'B1_24', })
  b124: string
  @Column({ field: 'B1_SUPPLIER_NAME', })
  b1SupplierName: string
  @Column({ field: 'B1_PUR_FLAG', })
  b1PurchaseFlag: string
  @Column({ field: 'B1_QTY', })
  b1Qty: string
  @Column({ field: 'B1_RGT_G', })
  b1RouteG: string
  @Column({ field: 'B1_RGT_EXP', })
  b1RouteExport: string
  @Column({ field: 'B1_RGT_IH', })
  b1RouteInhouse: string
  @Column({ field: 'B1_RGT_LSP', })
  b1RouteLSP: string
  @Column({ field: 'B1_RGT_LV2', })
  b1RouteLV2: string
  @Column({ field: 'B1_RGT_MSP', })
  b1RouteMSP: string
  @Column({ field: 'WD_SUPPLIER_CODE', })
  wdSupplierCode: string
  @Column({ field: 'WD_ISSUE_FLAG', })
  wdIssueFlag: string
  @Column({ field: 'WD_RECV_DATE', })
  wdReceiveDate: Date
  @Column({ field: 'WD_SEND_DATE', })
  wdSendDate: Date
  @Column({ field: 'WD_SUPPLIER_RECV_DATE', })
  wdSupplierRecvDate: Date
  @Column({ field: 'C5_SRC_PART_NO', })
  c5SourcePartNo: string
  @Column({ field: 'C5_SRC_STATUS', })
  c5SourceStatus: string
  @Column({ field: 'C5_PUR_COMPANY', })
  c5PurchaseCompany: string
  @Column({ field: 'C5_SUPPLIER_CODE', })
  c5SupplierCode: string
  @Column({ field: 'C5_DUE_DATE', })
  c5DueDate: Date
  @Column({ field: 'C5_RECV_DATE', })
  c5ReceiveDate: Date
  @Column({ field: 'C5_SUPPLIER_DECISION_DATE', })
  c5DecisionDate: Date
  @Column({ field: 'C5_BUYER_CODE', })
  c5BuyerCode: string
  @Column({ field: 'C5_BUYER_NAME', })
  c5BuyerName: string
  @Column({ field: 'C5_BUYER_EMAIL', })
  c5BuyerEmail: string
  @Column({ field: 'C5_MC_CODE', })
  c5MCCode: string
  @Column({ field: 'DW_ISSUE_PLAN_DATE', })
  dwIssuePlanDate: Date
  @Column({ field: 'DW_ISSUE_ACT_DATE', })
  dwIssueActualDate: Date
  @Column({ field: 'SP_MC', })
  spMC: string
  @Column({ field: 'SP_BUYER_CODE', })
  spBuyerCode: string
  @Column({ field: 'SP_BUYER_NAME', })
  spBuyerName: string
  @Column({ field: 'SP_PS_GROUP', })
  spPSGroup: string
  @Column({ field: 'SP_PART_NO', })
  spPartNo: string
  @Column({ field: 'SP_SUPPLIER_CODE', })
  spSupplierCode: string
  @Column({ field: 'SP_SUPPLIER_NAME', })
  spSupplierName: string
  @Column({ field: 'SP_SRC_FINISH_DATE', })
  spSourceFinishDate: Date
  @Column({ field: 'SP_ISSUE_DATE', })
  spIssueDate: Date
  @Column({ field: 'SP_QUO_PRICE', })
  spQuoPrice: number
  @Column({ field: 'SP_TOOL_PRICE', })
  spToolPrice: number
  @Column({ field: 'PP_REG_DATE', })
  ppRegDate: Date
  @Column({ field: 'PP_REG_PART_NO', })
  ppRegPartNo: string
  @Column({ field: 'PP_SUPPLIER_CODE', })
  ppSupplierCode: string
  @Column({ field: 'PP_ISSUE_DATE', })
  ppIssueDate: Date
  @Column({ field: 'PP_STATUS', })
  ppStatus: string
  @Column({ field: 'OE_SUPPLIER_CODE', })
  oeSupplierCode: string
  @Column({ field: 'OE_PRICE_FLAG', })
  oePriceFlag: string
  @Column({ field: 'OE_EFF_DATE', })
  oeEffectiveDate: Date
  @Column({ field: 'OE_PART_PRICE', })
  oePartPrice: number
  @Column({ field: 'OE_TOOL_COST', })
  oeToolCost: number
  @Column({ field: 'OE_CURRENCY', })
  oeCurrency: string
  @Column({ field: 'EX_PRICE_FLAG', })
  exPriceFlag: string
  @Column({ field: 'EX_EFF_DATE', })
  exEffectiveDate: Date
  @Column({ field: 'EX_PART_PRICE', })
  exPartPrice: number
  @Column({ field: 'EX_TOOL_COST', })
  exTootalCost: number
  @Column({ field: 'EX_CURRENCY', })
  exCurrency: string
  @Column({ field: 'TM_SUPPLIER_CODE', })
  tmSupplierCode: string
  @Column({ field: 'TM_VOLUME', })
  tmVolume: number
  @Column({ field: 'TM_ISSUE_DATE', })
  tmIssueDate: Date
  @Column({ field: 'TM_STATUS', })
  tmStatus: string
  @Column({ field: 'TM_BUYER_CODE', })
  tmBuyerCode: string
  @Column({ field: 'TM_PS_GROUP', })
  tmPSGroup: string
  @Column({ field: 'TM_UNIT', })
  tmUnit: number
  @Column({ field: 'DU_FLAG', })
  duFlag: string
  @Column({ field: 'DU_UPDATE_BY', })
  duUpdateBy: string
  @Column({ field: 'DU_UPDATE_DATE', })
  duUpdateDate: Date
  @Column({ field: 'DU_REASON', })
  duReason: string
  @Column({ field: 'LATEST_UPDATE', })
  lastestDate: Date

  @Column({ field: 'CREATE_BY', })
  createBy: string;

  @CreatedAt
  @Column({ field: 'CREATE_DT', })
  createDt: Date;

  @Column({ field: 'UPDATE_BY', })
  modifyBy: string;

  @UpdatedAt
  @Column({ field: 'UPDATE_DT', })
  modifyDt: Date;
}

export default TBRMapping
