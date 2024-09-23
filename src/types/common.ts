import type * as sequelize from 'sequelize';
// import { TBMSlgPrice } from '../models/tb-m-slg-price.model';

export type FindOptions<T = any> = T & {
  perPage?: number | string;
  page?: number | string;
  fields?: string[];
};

export interface FindResult<T = any> {
  data: Array<T>;
  total: number;
  pagination: {
    perPage: number;
    page: number;
  };
}
export interface User {
  userId: string;
}

export type PropertyWithOptionalArray<T> = {
  [P in keyof T]?: T[P] | T[P][];
};

export type InferAttributes<M extends sequelize.Model & { [key: string]: any }> = Omit<
  sequelize.InferAttributes<M>,
  'rowId' | 'createDt' | 'modifyDt'
> &
  Partial<Pick<M, 'rowId' | 'createDt' | 'modifyDt'>>;

//export type TBMSlgPriceAttributes = InferAttributes<TBMSlgPrice>;

export type newFindOptions = {
  filters?: object;
  fields?: string[];
  perPage?: number | string;
  page?: number | string;
  count?: boolean | 'true' | 'false';
};

export interface newFindResult<T = any> {
  data: Array<T>;
  total: number;
  pagination : {
    perPage: number;
    page: number | string;
  }
}

export const moneyDbFormat = 'FM9G999G999G999D00';
