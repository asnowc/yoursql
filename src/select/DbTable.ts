import { SqlSelectable } from "./selectable.ts";
import { where, ConditionParam, Constructable } from "../util.ts";
import type { TableType } from "./type.ts";
import { CurrentModifyWhere, CurrentOnConflict, CurrentWhere, Selection } from "./query_link.ts";
import { AfterUpdateOrReturn } from "./_update_impl.ts";
import { createUpdateSetFromObject } from "./_statement.ts";

/**
 * 数据库表
 * @public
 */
export class DbTable<T extends TableType> extends SqlSelectable<T> {
  constructor(readonly name: string) {
    super();
  }
  fromAs(as?: string): Selection {
    return new Selection(this.name, as);
  }
  /** 选择单表全部列 */
  select(columns: "*", as?: string): CurrentWhere<T>;
  /** 选择单表  */
  select(
    columns: Constructable<Record<string, boolean | string> | string>,
    as?: string
  ): CurrentWhere<Record<string, any>>;
  /** 选择单表  */
  select<R extends {}>(
    columns: Constructable<{ [key in keyof R]: boolean | string } | string>,
    as?: string
  ): CurrentWhere<R>;
  select(columns: "*" | Record<string, any>, as?: string): CurrentWhere<Record<string, any>> {
    return this.fromAs(as).select(columns);
  }
  /**
   * INSERT 语句，需要注意 SQL 注入
   * @example
   * ```ts
   * table.insert(["age","name"], "VALUES (18, 'hi'), (17, 'hh')") // INSERT INTO table(age,name) VALUES(18, 'hi'), (17, 'hh')
   * ```
   */
  insert(columns: string, values: Constructable<string>): CurrentOnConflict<T> {
    if (typeof columns !== "string" || !columns) throw new TypeError("columns 必须是有效的 string 类型");
    if (typeof values === "function") values = values();
    if (typeof values !== "string") throw new TypeError("values 必须是 string 或 function 类型");

    let sql = `INSERT INTO ${this.name}(${columns})\n${values}`;
    return new AfterUpdateOrReturn(sql);
  }
  /**
   * UPDATE 语句，需要注意 SQL 注入
   * @example
   * ```ts
   * table.update("age=3, name='hi'") // "UPDATE table SET age=3, name='hi'"
   * table.update({age: "3", name: "'hi'", k1: undefined, k2: ""}) // "UPDATE table SET age=3, name='hi'"
   * ```
   */
  update(values: Constructable<{ [key in keyof T]?: string } | string>): CurrentModifyWhere<T> {
    if (typeof values === "function") values = values();
    switch (typeof values) {
      case "object": {
        let sql = createUpdateSetFromObject(values);
        return new AfterUpdateOrReturn("UPDATE " + this.name + " " + sql);
      }
      case "string":
        return new AfterUpdateOrReturn("UPDATE " + this.name + " SET\n" + values);
      default:
        throw new TypeError("参数 values 错误");
    }
  }
  delete(option: DeleteOption = {}): CurrentModifyWhere<T> {
    let sql = "DELETE FROM " + this.name;
    sql += where(option.where);
    return new AfterUpdateOrReturn<T>(sql);
  }

  toSelect(): string {
    return this.name;
  }
  toString(): string {
    return this.name;
  }
}

/** @public */
export interface DeleteOption {
  where?: Constructable<ConditionParam | void>;
}
