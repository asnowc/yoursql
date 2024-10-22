import { SqlRaw } from "../sql_value/sql_value.ts";

/**
 * @public
 * @param T - 表格查询类型
 * @param Rq - 默认选择
 * @param Pa - 可选选择
 */
export type PickColumn<
  T extends { [key: string]: any },
  Rq extends keyof T = keyof T,
  Pa extends Exclude<keyof T, Rq> = never
> = {
  [key in Rq as null extends T[key] ? key : never]?: T[key];
} & {
  [key in Rq as null extends T[key] ? never : key]: T[key];
} & {
  [key in Pa]?: T[key];
};

/** @public */
export type UpdateRowValue<T extends object> = {
  [key in keyof T]?: T[key] | SqlRaw;
};

/**
 * 选择列并重命名
 * @public
 */
export type ColumnsSelectAs<T extends TableType> = {
  [key in keyof T]?: boolean | string;
};
/** @public */
export type OrderValue = "ASC" | "DESC";

/**
 * 表的选择参数
 * @public
 */
export type ColumnsSelected<T extends TableType> = ColumnsSelectAs<T> | "*";

/**
 * 从一个表格选择列，生成新的表格类型
 * @public
 */
export type SelectColumns<T extends TableType, R extends ColumnsSelected<T>> = R extends "*"
  ? T
  : R extends ColumnsSelectAs<T>
  ? {
      [key in keyof T as R[key] extends true ? key : StringOnly<R[key]>]: T[key];
    }
  : never;

type StringOnly<T> = T extends string ? T : never;

/** @public */
export type TableType = {
  [key: string]: any;
};
