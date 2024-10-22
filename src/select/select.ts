import { SqlSelectable, SqlQueryStatement } from "./selectable.ts";
import { genOderBy, OrderByParam, genWhere, WhereParam } from "./_statement.ts";
import type { TableType } from "./type.ts";
/** @public */
export interface SelectFilterOption<T extends object> {
  orderBy?: string | OrderByParam<T> | (() => string | OrderByParam<T>);
  offset?: number;
  limit?: number;
}
export interface FinalSelect<T extends TableType> extends SqlSelectable<T> {
  filter(option: SelectFilterOption<T>): SqlQueryStatement<T>;
}

class FinalSelectImpl<T extends TableType> extends SqlQueryStatement<T> implements FinalSelect<T> {
  constructor(statement: SqlQueryStatement) {
    super(statement.toString(), statement.columns);
  }
  filter(option: SelectFilterOption<T>): SqlQueryStatement<T> {
    let { orderBy } = option;
    let sql = this.toString();
    if (orderBy) sql += genOderBy(orderBy);
    if (option.limit) sql += "\nLIMIT " + option.limit;
    if (option.offset) sql += "\nOFFSET " + option.offset;

    return new SqlQueryStatement(sql, Array.from(this.columns));
  }
}

/** @public */
export type LastSelect = {
  select<T extends TableType>(columns: string[] | Record<string, string | boolean>): FinalSelect<T>;
};

export type AfterGroup = LastSelect & {
  having(param: WhereParam | (() => WhereParam)): LastSelect;
};
export type AfterWhere = AfterGroup & {
  groupBy(columns: string | string[]): AfterGroup;
};
export type AfterJoin = AfterWhere & {
  where(param: WhereParam | (() => WhereParam)): AfterWhere;
};

/** @public */
export interface JoinSelect extends AfterJoin {
  from(selectable: SqlSelectable<any> | string, as?: string): JoinSelect;
  crossJoin(selectable: SqlSelectable<any> | string, as?: string): JoinSelect;
  naturalJoin(selectable: SqlSelectable<any> | string, as?: string): JoinSelect;
  innerJoin(selectable: SqlSelectable<any> | string, as: string | undefined, on: string): JoinSelect;
  leftJoin(selectable: SqlSelectable<any> | string, as: string | undefined, on: string): JoinSelect;
  rightJoin(selectable: SqlSelectable<any> | string, as: string | undefined, on: string): JoinSelect;
  fullJoin(selectable: SqlSelectable<any> | string, as: string | undefined, on: string): JoinSelect;
}

/** @public */
export function createSelect(selectable: SqlSelectable<any> | string, as?: string): JoinSelect {
  return new SelectImpl("FROM " + fromAs(selectable, as)) as any;
}
function fromAs(selectable: SqlSelectable<any> | string, as?: string) {
  let sql = typeof selectable === "string" ? selectable : selectable.toSelect();
  if (as) sql += " " + as;
  return sql;
}
class SelectImpl implements JoinSelect {
  constructor(private str: string) {}

  toString() {
    return this.str;
  }
  #join(type: string, selectable: string | SqlSelectable<any>, as?: string, on?: string): JoinSelect {
    let sql = this.str + " " + type + " " + fromAs(selectable, as);
    if (on) sql += " ON " + on;
    return new SelectImpl(sql);
  }

  fullJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): JoinSelect {
    return this.#join("FULL JOIN", selectable, as, on);
  }
  innerJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): JoinSelect {
    return this.#join("INNER JOIN", selectable, as, on);
  }
  leftJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): JoinSelect {
    return this.#join("LEFT JOIN", selectable, as, on);
  }
  rightJoin(selectable: SqlSelectable<any>, as: string | undefined, on: string): JoinSelect {
    return this.#join("RIGHT JOIN", selectable, as, on);
  }

  naturalJoin(selectable: SqlSelectable<any>, as?: string | undefined): JoinSelect {
    return this.#join("NATURAL JOIN", selectable, as);
  }
  crossJoin(selectable: SqlSelectable<any>, as?: string | undefined): JoinSelect {
    return this.#join("CROSS JOIN", selectable, as);
  }
  from(selectable: SqlSelectable<any> | string, as?: string): JoinSelect {
    return new SelectImpl(this.str + "," + fromAs(selectable, as));
  }

  select<T extends TableType>(columns: string[] | Record<string, string>): FinalSelect<T>;
  select<T extends TableType>(columnsIn: string[] | Record<string, string>): FinalSelect<T> {
    let sql = "SELECT ";
    if (typeof columnsIn === "string") sql += columnsIn;
    else if (columnsIn instanceof Array) {
      if (columnsIn.length) sql += columnsIn[0];
      for (let i = 1; i < columnsIn.length; i++) sql += "," + columnsIn[i];
    } else {
      const keys = Object.keys(columnsIn);
      if (keys.length) sql += keys[0] + " AS " + columnsIn[keys[0]];
      let k: string;
      for (let i = 1; i < keys.length; i++) {
        k = keys[i];
        sql += "," + k + " AS " + columnsIn[k];
      }
    }
    return new FinalSelectImpl(new SqlQueryStatement(sql, []));
  }

  groupBy(columns: string | string[]): AfterGroup {
    let sql: string = this.str;
    if (typeof columns === "string") sql += " GROUP BY " + columns;
    else sql += " GROUP BY " + columns.join(",");
    return new SelectImpl(sql);
  }
  having(param: WhereParam | (() => WhereParam)): LastSelect {
    return new SelectImpl(this.str + genWhere(param));
  }
  where(param: WhereParam | (() => WhereParam)): AfterWhere {
    return new SelectImpl(this.str + genWhere(param));
  }
}

class TableRepeatError extends Error {
  constructor(tableName: string | number) {
    super("Table name '" + tableName + "' repeated");
  }
}
