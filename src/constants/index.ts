export const MAX_ROWS = 50;

export const RESOURCE_NOT_FOUND_MESSAGE = 'The resource does not exist.';
export const PRIORITY_1 = '1';
export const PRIORITY_2 = '2';
export const PRIORITY_3 = '3';

export const SEQUELIZE_OPERATION = {
  SINGLE_PARAMS: ['$eq', '$ne', '$is', '$not', '$gt', '$gte', '$lte', '$like', '$notLike'],
  MULTIPLE_PARAMS: ['$or', '$between', '$notBetween', '$in', '$notIn'],
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 10;

export const STATUS_WAITING_SUBMIT = '1';
export const STATUS_WAITING_APPROVAL_LEVEL1 = '2';
export const STATUS_WAITING_APPROVAL_LEVEL2 = '3';
export const STATUS_REJECTED = '4';
export const STATUS_APPROVE = '5';
export const WILDCARD_FAILED = 'The string contains a star not at the end.';
export const REX_SUPPLIER_CD: string = '${SUPPLIER_CD}';
export const REX_SUPPLIER_PLANT_CD: string = '${SUPPLIER_PLANT_CD}';
export const REXDATE: string = '${SEQ KEY}';
export const REXSEQCD: string = '${SEQ}';
export const REXSEQ: string = '$';
export * from './batch';
