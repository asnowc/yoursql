import { SqlValuesCreator } from "../sql_value/sql_value.ts";
import { UpdateRowValue, TableType } from "./type.ts";
import { getObjectListKeys, Constructable } from "../util.ts";
import { SqlChainModify } from "./query_chain_insert.ts";
import { DbTable } from "./DbTable.ts";
import { ChainInsert, ChainUpdate } from "./chain_modify.ts";

/** @public */
export class DbTableQuery<
  T extends TableType = Record<string, any>,
  C extends TableType = Partial<T>,
> extends DbTable<T> {
  constructor(
    name: string,
    private statement: SqlValuesCreator
  ) {
    super(name);
  }
  /**
   * @example
   * ```ts
   * table.insert({age:18, name:"hi"}) // INSERT INTO table(age,name) VALUES (18, 'hi')
   * table.insert([{age:18, name:"hi"}, {age:17, name:"hh"}]) // INSERT INTO table(age,name) VALUES(18, 'hi'), (17, 'hh')
   * ```
   */
  override insert(values: Constructable<UpdateRowValue<C> | UpdateRowValue<C>[]>): ChainInsert<T>;
  override insert(columns: string, values: Constructable<string>): ChainInsert<T>;
  override insert(
    values_column: string | Constructable<UpdateRowValue<C> | UpdateRowValue<C>[]>,
    _values?: Constructable<string>
  ): ChainInsert<T> {
    if (_values) return super.insert(values_column as string, _values);

    let values = values_column as Constructable<C | C[]>;
    if (typeof values === "function") values = values();
    if (typeof values !== "object") throw new TypeError("values 类型错误");
    let valuesStr: string;
    let insertCol: readonly string[];
    if (values instanceof Array) {
      if (values.length === 0) throw new Error("值不能为空");
      insertCol = Array.from(getObjectListKeys(values));
      valuesStr = `VALUES\n${this.statement.objectListToValuesList(values, insertCol)}`;
    } else {
      insertCol = Object.keys(values);
      valuesStr = `VALUES\n(${this.statement.objectToValues(values, insertCol)})`;
    }
    if (insertCol.length === 0) throw new Error("插入列不能为空");
    const columnStr = insertCol.join(",");

    let sql = `INSERT INTO ${this.name} (${columnStr})\n${valuesStr}`;
    return new SqlChainModify(sql);
  }
  /**
   * UPDATE 语句，与 update() 不同的是，它会将值进行安全转换
   * @example
   * ```ts
   * table.update({age:3, name:"hi"}, true) // "UPDATE table SET age=3, name='hi'"
   * ```
   */
  updateFrom(values: Constructable<UpdateRowValue<T>>): ChainUpdate<T> {
    if (typeof values === "function") values = values();
    let setStr: string;
    if (typeof values === "string") setStr = values;
    else {
      const updateKey = Object.entries(values);
      let setList: string[] = [];
      for (const [k, v] of updateKey) {
        if (v === undefined) continue;
        setList.push(k + "= " + this.statement.toSqlStr(v));
      }
      setStr = setList.join(",\n");
    }

    if (!setStr) throw new Error("值不能为空");

    let sql = `UPDATE ${this.name} SET\n${setStr}`;
    return new SqlChainModify(sql);
  }
}
