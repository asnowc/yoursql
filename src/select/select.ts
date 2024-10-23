import { SqlSelectable, SqlQueryStatement } from "./selectable.ts";
import { orderBy, OrderByParam, where, ConditionParam, selectColumns, having, SelectParam } from "../util.ts";
import type { TableType } from "./type.ts";
import { condition } from "./_statement.ts";

/** @public */
export interface CurrentLimit<T extends TableType> extends SqlQueryStatement<T> {
  limit(limit?: number, offset?: number): SqlQueryStatement<T>;
}
/** @public */
export interface CurrentOrderBy<T extends TableType> extends CurrentLimit<T> {
  orderBy(param: OrderByParam | (() => OrderByParam | void)): CurrentLimit<T>;
}
/** @public */
export interface CurrentHaving<T extends TableType> extends CurrentOrderBy<T> {
  having(param: ConditionParam | (() => ConditionParam | void)): CurrentLimit<T>;
}
/** @public */
export interface CurrentGroupBy<T extends TableType> extends CurrentOrderBy<T> {
  groupBy(columns: string | string[]): CurrentHaving<T>;
}
/** @public */
export interface CurrentWhere<T extends TableType> extends CurrentGroupBy<T> {
  where(param: ConditionParam | (() => ConditionParam | void)): CurrentGroupBy<T>;
}

class AfterSelectImpl<T extends TableType> extends SqlQueryStatement<T> implements CurrentWhere<T> {
  constructor(sql: string, columns: readonly string[]) {
    super(sql, columns);
  }
  where(param?: ConditionParam | (() => ConditionParam | void)): CurrentGroupBy<T> {
    return new AfterSelectImpl(this.toString() + where(param), this.columns);
  }
  groupBy(columns: string | string[]): CurrentHaving<T> {
    let sql: string = this.toString();
    if (typeof columns === "string") sql += " GROUP BY " + columns;
    else sql += " GROUP BY " + columns.join(",");
    return new AfterSelectImpl(sql, this.columns);
  }
  having(param?: ConditionParam | (() => ConditionParam | void)): CurrentLimit<T> {
    return new AfterSelectImpl(this.toString() + having(param), this.columns);
  }
  orderBy(param?: OrderByParam | (() => OrderByParam | void)): CurrentLimit<T> {
    return new AfterSelectImpl(this.toString() + orderBy(param), this.columns);
  }

  limit(limit?: number, offset?: number): SqlQueryStatement<T> {
    let sql = this.toString();
    if (limit) sql += "\nLIMIT " + limit;
    if (offset) sql += "\nOFFSET " + offset;
    return new SqlQueryStatement(sql, Array.from(this.columns));
  }
}

function fromAs(selectable: SqlSelectable<any> | string, as?: string) {
  let sql = typeof selectable === "string" ? selectable : selectable.toSelect();
  if (as) sql += " AS " + as;
  return sql;
}

/** @public */
export class Selection {
  static from(selectable: SqlSelectable<any> | string, as?: string): Selection {
    return new this(selectable, as);
  }
  #sql: string;
  constructor(selectable: SqlSelectable<any> | string, as?: string) {
    this.#sql = fromAs(selectable, as);
  }

  toString(): string {
    return "FROM " + this.#sql;
  }
  #join(
    type: string,
    selectable: string | SqlSelectable<any>,
    as?: string,
    on?: ConditionParam | (() => ConditionParam)
  ): Selection {
    let sql = this.#sql + "\n" + type + " " + fromAs(selectable, as);
    if (on) {
      sql += " ON " + condition(on);
    }
    return new Selection(sql);
  }

  fullJoin(
    selectable: SqlSelectable<any>,
    as: string | undefined,
    on: ConditionParam | (() => ConditionParam)
  ): Selection {
    return this.#join("FULL JOIN", selectable, as, on);
  }
  innerJoin(
    selectable: SqlSelectable<any>,
    as: string | undefined,
    on: ConditionParam | (() => ConditionParam)
  ): Selection {
    return this.#join("INNER JOIN", selectable, as, on);
  }
  leftJoin(
    selectable: SqlSelectable<any>,
    as: string | undefined,
    on: ConditionParam | (() => ConditionParam)
  ): Selection {
    return this.#join("LEFT JOIN", selectable, as, on);
  }
  rightJoin(
    selectable: SqlSelectable<any>,
    as: string | undefined,
    on: ConditionParam | (() => ConditionParam)
  ): Selection {
    return this.#join("RIGHT JOIN", selectable, as, on);
  }

  naturalJoin(selectable: SqlSelectable<any>, as?: string | undefined): Selection {
    return this.#join("NATURAL JOIN", selectable, as);
  }
  crossJoin(selectable: SqlSelectable<any>, as?: string | undefined): Selection {
    return this.#join("CROSS JOIN", selectable, as);
  }
  from(selectable: SqlSelectable<any> | string, as?: string): Selection {
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
  select<T extends TableType = TableType>(columns: string): CurrentWhere<T>;
  /**
   * 通过 object 选择 列
   * @example
   * ```ts
   * selection.select({"age":true, c:"count(*)"}) // SELECT age,count(*) AS c FROM ...
   * ```
   */
  select<T extends TableType>(
    columns: { [key in keyof T]: string | boolean } | (() => { [key in keyof T]: string | boolean })
  ): CurrentWhere<T>;
  select(columns: SelectParam | (() => SelectParam)): CurrentWhere<TableType>;
  select(columnsIn: SelectParam | (() => SelectParam)): CurrentWhere<TableType> {
    let columns: string[] = [];
    if (typeof columnsIn === "function") columnsIn = columnsIn();
    if (typeof columnsIn === "object") columns = Object.keys(columnsIn);

    let sql = "SELECT " + selectColumns(columnsIn);
    sql += "\n" + this.toString();

    return new AfterSelectImpl(sql, columns);
  }
}

class TableRepeatError extends Error {
  constructor(tableName: string | number) {
    super("Table name '" + tableName + "' repeated");
  }
}
