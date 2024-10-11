import { SqlValuesCreator, JsObjectMapSql, SqlValueEncoder } from "./sql_value.ts";

/** @public PgSql 转换器 */
export const pgSqlTransformer: JsObjectMapSql = new Map<new (...args: any[]) => any, SqlValueEncoder>([
  [
    Array,
    function encodePgArray(value) {
      return "ARRAY[" + value.map(this).join(", ") + "]";
    },
  ],
  [Date, (value) => SqlValuesCreator.string(value.toISOString())],
]);
