import { newFindOptions } from '../types/common';
import { pick } from 'lodash';

export const selectParamQuery = (query: any, list: string[]): newFindOptions => {
  const params: any = { ...pick(query, list) };
  const filteredEntries = Object.entries(params).filter(([_, value]) => value !== '');
  const filters = Object.fromEntries(filteredEntries);

  return {
    ...pick(query, ['page', 'perPage']),
    filters,
    fields: list,
  };
};

export const replaceWildCard = (objParam:string) => {
  let strParam:string = objParam.trim();

  if (strParam.charAt(strParam.length - 1) === '*' || strParam.charAt(strParam.length - 1) === '%') {
    strParam = strParam.replace(/\*$/, "%");
  }
  return strParam;
}