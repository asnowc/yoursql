import { SqlSelectable, SqlQueryStatement } from "./selectable.ts";
import { orderBy, OrderByParam, where, WhereParam, selectColumns, having } from "../util.ts";
import type { TableType } from "./type.ts";

/** @public */
export interface CurrentLimit<T extends TableType> extends SqlQueryStatement<T> {
  limit(limit?: number, offset?: number): SqlQueryStatement<T>;
}
/** @public */
export interface CurrentOrderBy<T extends TableType> extends CurrentLimit<T> {
  orderBy(param: OrderByParam | (() => OrderByParam)): CurrentLimit<T>;
}
/** @public */
export interface CurrentHaving<T extends TableType> extends CurrentOrderBy<T> {
  having(param: WhereParam | (() => WhereParam)): CurrentLimit<T>;
}
/** @public */
export interface CurrentGroupBy<T extends TableType> extends CurrentOrderBy<T> {
  groupBy(columns: string | string[]): CurrentHaving<T>;
}
/** @public */
export interface CurrentWhere<T extends TableType> extends CurrentGroupBy<T> {
  where(param: WhereParam | (() => WhereParam)): CurrentGroupBy<T>;
}

class AfterSelectImpl<T extends TableType> extends SqlQueryStatement<T> implements CurrentWhere<T> {
  constructor(sql: string, columns: readonly string[]) {
    super(sql, columns);
  }
  where(param: WhereParam | (() => WhereParam)): CurrentGroupBy<T> {
    return new AfterSelectImpl(this.toString() + where(param), this.columns);
  }
  groupBy(columns: string | string[]): CurrentHaving<T> {
    let sql: string = this.toString();
    if (typeof columns === "string") sql += " GROUP BY " + columns;
    else sql += " GROUP BY " + columns.join(",");
    return new AfterSelectImpl(sql, this.columns);
  }
  having(param: WhereParam | (() => WhereParam)): CurrentLimit<T> {
    return new AfterSelectImpl(this.toString() + having(param), this.columns);
  }
  orderBy(param: OrderByParam | (() => OrderByParam)): CurrentLimit<T> {
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
  #join(type: string, selectable: string | SqlSelectable<any>, as?: string, on?: string): Selection {
    let sql = this.#sql + "\n" + type + " " + fromAs(selectable, as);
    if (on) sql += " ON " + on;
    return new Selection(sql);
  }

  fullJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): Selection {
    return this.#join("FULL JOIN", selectable, as, on);
  }
  innerJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): Selection {
    return this.#join("INNER JOIN", selectable, as, on);
  }
  leftJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): Selection {
    return this.#join("LEFT JOIN", selectable, as, on);
  }
  rightJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): Selection {
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
  select<T extends TableType = TableType>(columns: "*" | string[]): CurrentWhere<T>;
  select<T extends TableType = TableType>(columns: { [key in keyof T]: string | boolean }): CurrentWhere<T>;
  select(columnsIn: "*" | string[] | TableType): CurrentWhere<any> {
    let sql = "SELECT ";
    let columns: string[] = [];
    if (typeof columnsIn === "string") sql += columnsIn;
    else {
      sql += selectColumns(columnsIn);
      if (columnsIn instanceof Array) {
        //TODO 想办法获取 columns
      } else columns = Object.keys(columnsIn);
    }
    sql += "\n" + this.toString();

    return new AfterSelectImpl(sql, columns);
  }
}

class TableRepeatError extends Error {
  constructor(tableName: string | number) {
    super("Table name '" + tableName + "' repeated");
  }
}
