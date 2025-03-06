import {
  ChainSelectGroupBy,
  ChainSelectHaving,
  ChainSelectLimit,
  ChainSelectWhere,
  SqlSelectable,
  SqlStatementDataset,
  SqlTextStatementDataset,
} from "./query_chain_abstract.ts";
import {
  orderBy,
  OrderByParam,
  where,
  ConditionParam,
  selectColumns,
  having,
  SelectParam,
  Constructable,
} from "../util.ts";
import type { TableType } from "./type.ts";
import { condition } from "./_statement.ts";

/**
 * @public ChainSelectWhere 的默认实现
 */
export class SqlSelectChain<T extends TableType> extends SqlTextStatementDataset<T> implements ChainSelectWhere<T> {
  where(param?: Constructable<ConditionParam | void>): ChainSelectGroupBy<T> {
    return new SqlSelectChain(this.toString() + where(param));
  }
  groupBy(columns: string | string[]): ChainSelectHaving<T> {
    let sql: string = this.toString();
    if (typeof columns === "string") sql += " GROUP BY " + columns;
    else sql += " GROUP BY " + columns.join(",");
    return new SqlSelectChain(sql);
  }
  having(param?: Constructable<ConditionParam | void>): ChainSelectLimit<T> {
    return new SqlSelectChain(this.toString() + having(param));
  }
  orderBy(param?: Constructable<OrderByParam | void>): ChainSelectLimit<T> {
    return new SqlSelectChain(this.toString() + orderBy(param));
  }
  limit(limit?: number, offset?: number): SqlStatementDataset<T> {
    let sql = this.toString();
    let type: string;
    if (limit) {
      type = typeof limit;
      if (type === "number" || type === "bigint") sql += "\nLIMIT " + limit;
      else throw new TypeError("limit 必须是个整数：" + limit);
    }
    if (offset) {
      type = typeof offset;
      if (type === "number" || type === "bigint") sql += "\nOFFSET " + offset;
      else throw new TypeError("offset 必须是个整数：" + limit);
    }
    return new SqlTextStatementDataset(sql);
  }
}
function fromAs(selectable: Constructable<SqlSelectable | string>, as?: string) {
  if (typeof selectable === "function") selectable = selectable();
  let sql = typeof selectable === "string" ? selectable : selectable.toSelect();
  if (as) sql += " AS " + as;
  return sql;
}

/** @public */
export class Selection {
  static from(selectable: Constructable<SqlSelectable | string>, as?: string): Selection {
    return new this(selectable, as);
  }
  #sql: string;
  constructor(selectable: Constructable<SqlSelectable | string>, as?: string) {
    this.#sql = fromAs(selectable, as);
  }

  toString(): string {
    return "FROM " + this.#sql;
  }
  #join(
    type: string,
    selectable: Constructable<SqlSelectable | string>,
    as?: string,
    on?: Constructable<ConditionParam>
  ): Selection {
    let sql = this.#sql + "\n" + type + " " + fromAs(selectable, as);
    if (on) {
      sql += " ON " + condition(on);
    }
    return new Selection(sql);
  }

  fullJoin(
    selectable: Constructable<SqlSelectable | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("FULL JOIN", selectable, as, on);
  }
  innerJoin(
    selectable: Constructable<SqlSelectable | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("INNER JOIN", selectable, as, on);
  }
  leftJoin(
    selectable: Constructable<SqlSelectable | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("LEFT JOIN", selectable, as, on);
  }
  rightJoin(
    selectable: Constructable<SqlSelectable | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("RIGHT JOIN", selectable, as, on);
  }

  naturalJoin(selectable: Constructable<SqlSelectable | string>, as?: string | undefined): Selection {
    return this.#join("NATURAL JOIN", selectable, as);
  }
  crossJoin(selectable: Constructable<SqlSelectable | string>, as?: string | undefined): Selection {
    return this.#join("CROSS JOIN", selectable, as);
  }
  from(selectable: Constructable<SqlSelectable | string>, as?: string): Selection {
    return new Selection(this.#sql + "," + fromAs(selectable, as));
  }
  /** 选择全部列 */
  select<T extends TableType = Record<string, any>>(columns: "*"): ChainSelectWhere<T>;
  /**
   * 自定义SQL选择语句
   * @example
   * ```ts
   * selection.select("t.age, count(*) AS c") // SELECT t.age,count(*) AS c FROM ...
   * ```
   */
  select(columns: Constructable<SelectParam>): ChainSelectWhere<Record<string, any>>;
  /**
   * 通过 object 选择 列
   * @example
   * ```ts
   * selection.select({"age":true, c:"count(*)"}) // SELECT age,count(*) AS c FROM ...
   * ```
   */
  select<T extends TableType>(
    columns: Constructable<{ [key in keyof T]: string | boolean } | string>
  ): ChainSelectWhere<T>;
  select(columnsIn: Constructable<SelectParam>): ChainSelectWhere<TableType> {
    if (typeof columnsIn === "function") columnsIn = columnsIn();

    let sql = "SELECT " + selectColumns(columnsIn);
    sql += "\n" + this.toString();

    return new SqlSelectChain(sql);
  }
}
