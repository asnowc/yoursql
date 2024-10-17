import { DbTableQuery } from "../select/TableQuery.ts";
import type { TableType } from "../select/type.ts";
import type { SqlValuesCreator } from "../sql_value/sql_value.ts";
import type { ColumnMeta, TableDefined } from "./infer_db_type.ts";
import { TypeChecker } from "./checker.ts";
/**
 * 完整数据库表数据
 * @public
 */
export class YourTable<T extends TableType = TableType, C extends TableType = T> extends DbTableQuery<T, C> {
  constructor(name: string, private define: TableDefined, sqlValue: SqlValuesCreator) {
    super(name, Object.keys(define), sqlValue);
  }
  getColumnMeta(name: keyof T): ColumnMeta<unknown> {
    return Reflect.get(this.define, name);
  }
  createTypeChecker<T>(keys: readonly string[]): TypeChecker<T> {
    let map = new Map<string, ColumnMeta<any>>();
    let defined = this.define;
    let k: string;
    for (let i = 0; i < keys.length; i++) {
      k = keys[i];
      if (defined[k] === undefined) throw new Error(`key ${k} 未定义`);
      map.set(k, defined[k]);
    }
    return new TypeChecker(map);
  }
}
