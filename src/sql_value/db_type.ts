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

/**
 * @public
 * @deprecated 已废弃
 * PgSql的值转换
 */
export class PgSqlValue extends SqlValuesCreator {
  constructor(custom?: JsObjectMapSql) {
    const map: JsObjectMapSql = new Map(custom ? [...pgSqlTransformer, ...custom] : pgSqlTransformer);
    super(map);
  }
  timestamp(value: Date): string {
    return SqlValuesCreator.string(value.toISOString());
  }
  array(value: any[]): string {
    return this.toSqlStr(value, Array);
  }
}
