import { where, ConditionParam, Constructable, SelectParam } from "../util.ts";
import type { TableType } from "./type.ts";
import { Selection } from "./query_chain_select.ts";
import { SqlChainModify } from "./query_chain_insert.ts";
import { createUpdateSetFromObject } from "./_statement.ts";
import { ChainDelete, ChainInsert, ChainUpdate } from "./chain_modify.ts";
import { ChainSelect } from "./chain_select.ts";

/**
 * 数据库表
 * @public
 */
export class DbTable<T extends TableType> {
  constructor(readonly name: string) {}
  fromAs(as?: string): Selection {
    return new Selection(this.name, as);
  }
  /** 选择单表全部列 */
  select(columns: "*", as?: string): ChainSelect<T>;
  /** 选择单表，带提示  */
  select(
    columns: Constructable<{ [key in keyof T]?: string | boolean } & { [key: string]: string | boolean }>,
    as?: string
  ): ChainSelect<Record<string, any>>;
  /** 选择单表  */
  select<R extends {} = Record<string, any>>(columns: Constructable<string | string[]>, as?: string): ChainSelect<R>;
  /** 选择单表  */
  select<R extends {}>(
    columns: Constructable<{ [key in keyof R]: boolean | string } | string | string[]>,
    as?: string
  ): ChainSelect<R>;
  select(columns: Constructable<SelectParam>, as?: string): ChainSelect<Record<string, any>> {
    return this.fromAs(as).select(columns);
  }
  /**
   * INSERT 语句，需要注意 SQL 注入
   * @example
   * ```ts
   * table.insert(["age","name"], "VALUES (18, 'hi'), (17, 'hh')") // INSERT INTO table(age,name) VALUES(18, 'hi'), (17, 'hh')
   * ```
   */
  insert(columns: string, values: Constructable<string>): ChainInsert<T> {
    if (typeof columns !== "string" || !columns) throw new TypeError("columns 必须是有效的 string 类型");
    if (typeof values === "function") values = values();
    if (typeof values !== "string") throw new TypeError("values 必须是 string 或 function 类型");

    let sql = `INSERT INTO ${this.name}(${columns})\n${values}`;
    return new SqlChainModify(sql);
  }
  /**
   * UPDATE 语句，需要注意 SQL 注入
   * @example
   * ```ts
   * table.update("age=3, name='hi'") // "UPDATE table SET age=3, name='hi'"
   * table.update({age: "3", name: "'hi'", k1: undefined, k2: ""}) // "UPDATE table SET age=3, name='hi'"
   * ```
   */
  update(values: Constructable<{ [key in keyof T]?: string } | string>): ChainUpdate<T> {
    if (typeof values === "function") values = values();
    switch (typeof values) {
      case "object": {
        let sql = createUpdateSetFromObject(values);
        return new SqlChainModify("UPDATE " + this.name + " " + sql);
      }
      case "string":
        return new SqlChainModify("UPDATE " + this.name + " SET\n" + values);
      default:
        throw new TypeError("参数 values 错误");
    }
  }
  delete(option: DeleteOption = {}): ChainDelete<T> {
    let sql = "DELETE FROM " + this.name;
    sql += where(option.where);
    return new SqlChainModify<T>(sql);
  }

  toSelect(): string {
    return this.name;
  }
}

/** @public */
export interface DeleteOption {
  where?: Constructable<ConditionParam | void>;
}
