export type BuildQueryOptions = {
  filters?: object;
  fields?: string[];
  order?: string[];
  limit?: number | string;
  offset?: number | string;
  include?: string[] | any;
  count?: boolean | 'true' | 'false';
};
