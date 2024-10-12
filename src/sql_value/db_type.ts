import { SqlValuesCreator, JsObjectMapSql, SqlValueEncoder, ManualType } from "./sql_value.ts";

/** @public PgSql 转换器 */
export const pgSqlTransformer: JsObjectMapSql = new Map<new (...args: any[]) => any, SqlValueEncoder>([
  [
    Array,
    function encodePgArray(value: any[]) {
      if (value.length === 0) return "NULL";
      const valueStr: string[] = [];

      let type: ManualType | undefined;
      let basicType;
      for (let i = 0; i < value.length; i++) {
        if (type) {
          valueStr[i] = this.toSqlStr(value[i], type);
        } else {
          basicType = typeof value[i];
          if (value[i] === null || basicType === "undefined") basicType = undefined;
          valueStr[i] = this.toSqlStr(value[i], type);
        }
      }
      return "ARRAY[" + valueStr.join(",") + "]";
    },
  ],
  [Date, (value) => SqlValuesCreator.string(value.toISOString())],
]);
