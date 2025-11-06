/** @public 断言类型 */
export type AssertJsType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

/** @public */
export type SqlValueData = {
  columns: readonly string[];
  text: string;
};

/** @public */
export type ColumnToValueConfig = {
  /** 设置显式 SQL 类型，设置后会显示转换 SQL 值 */
  sqlType?: string;
  /** 设置 JS 转换器类型，引导转换器如何将 JS 值转换为 SQL 值 */
  assertJsType?: AssertJsType;
};
/** @public */
export type ObjectToValueKeys<T extends {}> =
  | readonly (keyof T)[]
  | { [key in keyof T]?: string | undefined | ColumnToValueConfig };
