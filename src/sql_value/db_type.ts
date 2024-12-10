import { SqlValuesCreator, JsObjectMapSql, SqlValueEncoder, AssertJsType } from "./sql_value.ts";

/** @public PgSql 转换器 */
export const pgSqlTransformer: JsObjectMapSql = new Map<new (...args: any[]) => any, SqlValueEncoder>([
  [
    Array,
    function encodePgArray(value: any[]) {
      if (value.length === 0) return "NULL";
      const valueStr: string[] = [];

      let type: AssertJsType | undefined;
      let basicType;
      for (let i = 0; i < value.length; i++) {
        if (value[i] === null || value[i] === undefined) valueStr[i] = this.toSqlStr(value[i]);
        else if (type) {
          valueStr[i] = this.toSqlStr(value[i], type);
        } else {
          basicType = typeof value[i];
          if (basicType === "object") {
            type = this.getClassType(value[i]) as any;
          } else type = basicType as any;
          valueStr[i] = this.toSqlStr(value[i], type);
        }
      }
      return "ARRAY[" + valueStr.join(",") + "]";
    },
  ],
  [
    Date,
    function (value) {
      return SqlValuesCreator.string(value.toISOString());
    },
  ],
]);
