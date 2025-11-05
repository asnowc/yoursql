import { JsObjectMapSql, SqlValuesCreator } from "@asla/yoursql";

export function createAssertsSqlValue() {
  const define: JsObjectMapSql = new Map();
  define.set(Array, toArray);
  define.set(Object, toJson);
  return SqlValuesCreator.create(define);
}
function toJson(this: SqlValuesCreator, value: object) {
  return this.toSqlStr(JSON.stringify(value));
}
function toArray(this: SqlValuesCreator, values: any[]) {
  return "ARRAY[" + values.map((v) => this.toSqlStr(v)).join(",") + "]";
}
