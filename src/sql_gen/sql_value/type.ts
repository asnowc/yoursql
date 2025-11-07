/** @public 断言类型 */
export type AssertJsType = "bigint" | "number" | "string" | "boolean" | "object" | (new (...args: any[]) => any);

/** @public */
export type ColumnToValueConfig = {
  /** 设置显式 SQL 类型，设置后会显式转换 SQL 值 */
  sqlType?: string;
  /** 设置 JS 转换器类型，引导转换器如何将 JS 值转换为 SQL 值 */
  assertJsType?: AssertJsType;
  /** undefined 会被替换的值 */
  sqlDefault?: string;
};
/** @public */
export type ObjectToValueKeys<T extends {}> =
  | readonly string[]
  | ({ [key in keyof T as key extends string ? key : never]?: string | ColumnToValueConfig } & {
      [key: string]: string | undefined | ColumnToValueConfig;
    });
