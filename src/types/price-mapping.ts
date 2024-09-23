import { InferAttributes } from 'sequelize';
import { TBRMapping } from '../models/tb-r-mapping.model';

export type TBRPriceMappingDAttributes = InferAttributes<TBRMapping>;

export type Filters = {
  carFamilyCode?: string[] | any;
  // Family Code
  projectCode?: string[] | any;// Project Code
  mc?: string;// MC 
  eciNo?: string;// ECI No.
  c5Status?: string;// C5 Status
  purFlag?: string;// PUR Flag
  psGroup?: string[] | any;// PS Group 
  supplierCode?: string;// Supplier Code
  partNo?: string// Part No.
  parentPartNo?: string// Parent Part No. 
  stage?: string// Stage
  country?: string// Country
  buyerName?: string// Buyer Name 
  supplierName?: string;// Supplier Name 
  partName?: string;// Part Name
  cspPartNo?: string;// CSP Part No. 
  dwgIssue?: string;// DWG Issue
  buyerCode?: string[] | any; // Buyer Code 
  partMasterStatus?: string// Part master status 
  toolingOrderStatus?: string// Tooling Order Status
  priceFlag?: string// Price Flag 
  prodPartNoIssue?: string// Production P/No. Issue 
  status?: string;// Active/Inactive Status
  issueTyFrom?: string;// Issue TY From 
  issueTyTo?: string;// Issue TY To
  toolingIssueFrom?: string// Tooling Issue From 
  toolingIssueTo?: string// Tooling Issue To
  dueDateFrom?: string// Due Date From 
  dueDateTo?: string// Due Date To
  dwgIssuePlanFrom?: string// DWG Issue Plan From 
  dwgIssuePlanTo?: string// DWG Issue Plan To

};

export type disuse = {
  items:string[],
  duFlag :string,
  reason:string
}

