/**
 * MAKE: move to lib common
 */

import {
  Op,
  type OrderItem,
  type FindOptions as SequelizeFindOptions
} from 'sequelize';
import { MAX_ROWS, SEQUELIZE_OPERATION } from '../constants';
import { isArray } from 'lodash';
import { BuildQueryOptions } from '../types/build-query';

/* istanbul ignore next */
export const isCount = (value: string | boolean) => {
  return typeof value === 'boolean' ? value : value !== 'false';
};

/**
 * Build sequelize find options from query string
 *
 * TODO: implement build query from url and unit test
 *  - field
 *  - order
 *  - include
 *  - filter: add cond
 */

const filterCondition = (
  query: SequelizeFindOptions,
  field: string,
  condition: string,
  value: string
): SequelizeFindOptions => {
  let search: string | string[] = '';
  if (SEQUELIZE_OPERATION.SINGLE_PARAMS.includes(condition)) {
    search = value;
  } else if (SEQUELIZE_OPERATION.MULTIPLE_PARAMS.includes(condition)) {
    search = value.split(':');
  }
  const cond = condition.replace('$', '');
  query.where[field] = {
    [Op[cond]]: search,
  };
  return query;
};

const buildQuery = <T = any>(options: Omit<BuildQueryOptions, 'count'>): SequelizeFindOptions<T> => {
  const query: SequelizeFindOptions<T> = {
    where: {},
    limit: MAX_ROWS,
    offset: 0,
  };

  const filters = options.filters;
  const limit = +options?.limit;
  const offset = +options?.offset;
  const fields = options?.fields;
  const order = options?.order;
  const include = options?.include;

  if (typeof filters === 'object') {
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        const filterValue = filters[key];
        if (typeof filterValue === 'object') {
          for (const cond in filterValue) {
            if (filterValue.hasOwnProperty(cond)) {
              const filterKey = key.replace(/\$/g, '_'); // Use key or key_cond as the filter key
              const condition = filterValue[cond];
              filterCondition(query, filterKey, cond, condition);
            }
          }
        } else {
          query.where[key] = filterValue;
        }
      }
    }
  }

  if (!Number.isNaN(limit)) {
    query.limit = limit;
  }

  if (!Number.isNaN(offset)) {
    query.offset = offset;
  }

  if (isArray(fields)) {
    query.attributes = fields;
  }

  if (isArray(order)) {
    const orderLists: OrderItem[] = order.map((value) => value.split(':') as OrderItem);
    query.order = orderLists;
  }

  if (include) {
    query.include = include
  }
  
  return query;
};

export const stringWildCard = (text: string): { message: string; isError: boolean } => {
  let result = { message: 'string', isError: false };
  
  if (text.endsWith('*')) {
    result.message = text.toUpperCase().replace(/\*$/, '%');
  } else if (text.includes('*')) {
    result.isError = true;
  } else {
    result.message = text.toUpperCase();
  }
  
  return result;
};

export default buildQuery;
