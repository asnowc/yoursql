import { SqlSelectable, SqlQueryStatement } from "./selectable.ts";
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

/** @public */
export interface CurrentLimit<T extends TableType> extends SqlQueryStatement<T> {
  limit(limit?: number, offset?: number): SqlQueryStatement<T>;
}
/** @public */
export interface CurrentOrderBy<T extends TableType> extends CurrentLimit<T> {
  orderBy(param: Constructable<OrderByParam | void>): CurrentLimit<T>;
}
/** @public */
export interface CurrentHaving<T extends TableType> extends CurrentOrderBy<T> {
  having(param: Constructable<ConditionParam | void>): CurrentLimit<T>;
}
/** @public */
export interface CurrentGroupBy<T extends TableType> extends CurrentOrderBy<T> {
  groupBy(columns: string | string[]): CurrentHaving<T>;
}
/** @public */
export interface CurrentWhere<T extends TableType> extends CurrentGroupBy<T> {
  where(param: Constructable<ConditionParam | void>): CurrentGroupBy<T>;
}

class AfterSelectImpl<T extends TableType> extends SqlQueryStatement<T> implements CurrentWhere<T> {
  constructor(sql: string) {
    super(sql);
  }
  where(param?: Constructable<ConditionParam | void>): CurrentGroupBy<T> {
    return new AfterSelectImpl(this.toString() + where(param));
  }
  groupBy(columns: string | string[]): CurrentHaving<T> {
    let sql: string = this.toString();
    if (typeof columns === "string") sql += " GROUP BY " + columns;
    else sql += " GROUP BY " + columns.join(",");
    return new AfterSelectImpl(sql);
  }
  having(param?: Constructable<ConditionParam | void>): CurrentLimit<T> {
    return new AfterSelectImpl(this.toString() + having(param));
  }
  orderBy(param?: Constructable<OrderByParam | void>): CurrentLimit<T> {
    return new AfterSelectImpl(this.toString() + orderBy(param));
  }

  limit(limit?: number, offset?: number): SqlQueryStatement<T> {
    let sql = this.toString();
    if (limit) sql += "\nLIMIT " + limit;
    if (offset) sql += "\nOFFSET " + offset;
    return new SqlQueryStatement(sql);
  }
}

function fromAs(selectable: Constructable<SqlSelectable<any> | string>, as?: string) {
  if (typeof selectable === "function") selectable = selectable();
  let sql = typeof selectable === "string" ? selectable : selectable.toSelect();
  if (as) sql += " AS " + as;
  return sql;
}

/** @public */
export class Selection {
  static from(selectable: Constructable<SqlSelectable<any> | string>, as?: string): Selection {
    return new this(selectable, as);
  }
  #sql: string;
  constructor(selectable: Constructable<SqlSelectable<any> | string>, as?: string) {
    this.#sql = fromAs(selectable, as);
  }

  toString(): string {
    return "FROM " + this.#sql;
  }
  #join(
    type: string,
    selectable: Constructable<SqlSelectable<any> | string>,
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
    selectable: Constructable<SqlSelectable<any> | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("FULL JOIN", selectable, as, on);
  }
  innerJoin(
    selectable: Constructable<SqlSelectable<any> | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("INNER JOIN", selectable, as, on);
  }
  leftJoin(
    selectable: Constructable<SqlSelectable<any> | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("LEFT JOIN", selectable, as, on);
  }
  rightJoin(
    selectable: Constructable<SqlSelectable<any> | string>,
    as: string | undefined,
    on: Constructable<ConditionParam>
  ): Selection {
    return this.#join("RIGHT JOIN", selectable, as, on);
  }

  naturalJoin(selectable: Constructable<SqlSelectable<any> | string>, as?: string | undefined): Selection {
    return this.#join("NATURAL JOIN", selectable, as);
  }
  crossJoin(selectable: Constructable<SqlSelectable<any> | string>, as?: string | undefined): Selection {
    return this.#join("CROSS JOIN", selectable, as);
  }
  from(selectable: Constructable<SqlSelectable<any> | string>, as?: string): Selection {
    return new Selection(this.#sql + "," + fromAs(selectable, as));
  }
  /** 选择全部列 */
  select<T extends TableType = TableType>(columns: "*"): CurrentWhere<T>;
  /**
   * 自定义SQL选择语句
   * @example
   * ```ts
   * selection.select("t.age, count(*) AS c") // SELECT t.age,count(*) AS c FROM ...
   * ```
   */
  select<T extends TableType = TableType>(columns: Constructable<string>): CurrentWhere<T>;
  /**
   * 通过 object 选择 列
   * @example
   * ```ts
   * selection.select({"age":true, c:"count(*)"}) // SELECT age,count(*) AS c FROM ...
   * ```
   */
  select<T extends TableType>(columns: Constructable<{ [key in keyof T]: string | boolean }>): CurrentWhere<T>;
  select(columns: Constructable<SelectParam>): CurrentWhere<TableType>;
  select(columnsIn: Constructable<SelectParam>): CurrentWhere<TableType> {
    if (typeof columnsIn === "function") columnsIn = columnsIn();

    let sql = "SELECT " + selectColumns(columnsIn);
    sql += "\n" + this.toString();

    return new AfterSelectImpl(sql);
  }
}

class TableRepeatError extends Error {
  constructor(tableName: string | number) {
    super("Table name '" + tableName + "' repeated");
  }
}
