import type { ColumnMeta, TableDefined } from "./infer_db_type.ts";
import { TypeChecker } from "./checker.ts";
import { TableType } from "../util.ts";
/**
 * 完整数据库表数据
 * @public
 */
export class YourTable<T extends TableType = TableType> {
  constructor(
    readonly name: string,
    private define: TableDefined,
  ) {
    this.columns = Object.keys(define);
  }
  readonly columns: readonly string[];
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
