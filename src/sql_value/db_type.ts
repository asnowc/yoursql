import { SqlValuesCreator, JsObjectMapSql, SqlValueEncoder } from "./sql_value.ts";

/** @public PgSql 转换器 */
export const pgSqlTransformer: JsObjectMapSql = new Map<new (...args: any[]) => any, SqlValueEncoder>([
  [
    Array,
    function encodePgArray(value: any[]) {
      return (
        "ARRAY[" +
        value
          .map(function (this: SqlValuesCreator, item) {
            return this.toSqlStr(item);
          })
          .join(", ") +
        "]"
      );
    },
  ],
  [Date, (value) => SqlValuesCreator.string(value.toISOString())],
]);
