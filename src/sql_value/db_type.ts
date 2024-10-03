import { SqlValuesCreator } from "./sql_value.ts";

/**
 * @public
 * PgSql的值转换
 */
export class PgSqlValue extends SqlValuesCreator {
  constructor() {
    const map = new Map();
    map.set(Array, PgSqlValue.prototype.array);
    map.set(Date, PgSqlValue.prototype.timestamp);
    super(map);
  }
  timestamp(value: Date): string {
    return SqlValuesCreator.string(value.toISOString());
  }
  array(value: any[]): string {
    return "ARRAY[" + value.map(this.toSqlStr.bind(this)).join(", ") + "]";
  }
}