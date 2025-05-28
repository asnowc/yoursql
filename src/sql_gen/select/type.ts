/**
 * @deprecated 已废弃，改用 ToInsertType
 * @public
 * @param T - 表格查询类型
 * @param Rq - 默认选择
 * @param Pa - 可选选择
 */
export type PickColumn<
  T extends { [key: string]: any },
  Rq extends keyof T = keyof T,
  Pa extends Exclude<keyof T, Rq> = never,
> = {
  [key in Rq as null extends T[key] ? key : never]?: T[key];
} & {
  [key in Rq as null extends T[key] ? never : key]: T[key];
} & {
  [key in Pa]?: T[key];
};

/**
 * 推断表插入类型
 * @public
 * @param T - 表格创建类型
 * @param Pa - 可选列
 */
export type ToInsertType<T extends { [key: string]: any }, Pa extends keyof T = never> = {
  [key in keyof T as key extends Pa ? never : null extends T[key] ? never : key]: T[key];
} & {
  [key in keyof T as null extends T[key] ? key : key extends Pa ? key : never]?: T[key];
};

/** @public */
export type UpdateRowValue<T extends object> = {
  [key in keyof T]?: T[key] | String;
};

/** @public */
export type OrderValue = "ASC" | "DESC";

/** @public */
export type TableType = {
  [key: string]: any;
};
