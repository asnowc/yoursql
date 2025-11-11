import { ConditionParam, Constructable, TableType } from "../util.ts";
import { condition, selectableToString, whereToString } from "../_statement.ts";
import { SqlSelectable, SqlTextStatementDataset } from "../SqlStatement.ts";
import {
  ChainSelectAfterFirstFrom,
  ChainSelect,
  ChainSelectAfterFrom,
  SelectJoinOption,
  ChainSelectAfterWhere,
  ChainSelectAfterGroupBy,
  ChainSelectAfterHaving,
  ChainSelectAfterOrderBy,
  ChainSelectAfterLimit,
  SelectAsNameOption,
  OrderBehavior,
  OrderByParam,
} from "./select_chain.ts";
export class SelectChainAfterSelect<T extends TableType> implements ChainSelect<T> {
  constructor(sql: string) {
    this.#sql = sql;
  }
  #sql: string;
  from(
    selectable: Constructable<SqlSelectable | string>,
    option: SelectAsNameOption = {},
  ): ChainSelectAfterFirstFrom<T> {
    let sql = this.#sql + "\nFROM " + selectableToString(selectable, option.as);
    return new SelectChain<T>(sql);
  }
  toString() {
    return this.#sql;
  }
}

class SelectChain<T extends TableType> extends SqlTextStatementDataset<T> implements ChainSelectAfterFirstFrom<T> {
  constructor(sql: string) {
    super(sql);
  }
  from(
    selectable: Constructable<SqlSelectable | string>,
    option: SelectAsNameOption = {},
  ): ChainSelectAfterFirstFrom<T> {
    let sql = this.genSql() + ", " + selectableToString(selectable, option.as);
    return new SelectChain<T>(sql);
  }
  fullJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nFULL JOIN ", selectable, options);
  }
  innerJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nINNER JOIN ", selectable, options);
  }
  leftJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nLEFT JOIN ", selectable, options);
  }
  rightJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nRIGHT JOIN ", selectable, options);
  }

  naturalJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nNATURAL JOIN ", selectable, options);
  }
  crossJoin(selectable: Constructable<SqlSelectable | string>, options?: SelectJoinOption): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nCROSS JOIN ", selectable, options);
  }

  where(param?: Constructable<ConditionParam | void>): ChainSelectAfterWhere<T> {
    return new SelectChain(this.genSql() + whereToString(param));
  }
  groupBy(columns?: string | string[]): ChainSelectAfterGroupBy<T> {
    let add: string | undefined;
    if (typeof columns === "string") add = columns;
    else if (columns) add = columns.join(",");

    if (!add) return new SelectChain(this.genSql());

    return new SelectChain(this.genSql() + "\nGROUP BY " + add);
  }
  having(param?: Constructable<ConditionParam | void>): ChainSelectAfterHaving<T> {
    return new SelectChain(this.genSql() + havingToString(param));
  }
  orderBy(param?: Constructable<OrderByParam | void>): ChainSelectAfterOrderBy<T> {
    return new SelectChain(this.genSql() + orderBy(param));
  }
  limit(limit?: number, offset?: number): ChainSelectAfterLimit<T> {
    let sql = this.genSql();
    let type: string;
    type = typeof limit;
    if (type === "number" || type === "bigint") sql += "\nLIMIT " + limit;

    type = typeof offset;
    if (type === "number" || type === "bigint") sql += "\nOFFSET " + offset;

    return new SqlTextStatementDataset(sql);
  }
}

function joinToString<T extends TableType>(
  sql: string,
  selectable: Constructable<SqlSelectable | string>,
  options: SelectJoinOption = {},
) {
  sql += selectableToString(selectable, options.as);
  if (options.on) {
    let on = options.on;
    if (typeof on === "function") on = on();
    sql += " ON " + condition(on);
  }
  return new SelectChain<T>(sql);
}

function havingToString(conditions?: Constructable<ConditionParam | void>, type?: "AND" | "OR"): string {
  const sql = condition(conditions, type);
  if (sql) return "\nHAVING " + sql;
  return "";
}

/**
 * 生成 ORDER BY 语句
 * @public
 * @example
 * ```ts
 *
 * orderBy([]) // ""
 * orderBy({}) // ""
 * orderBy() // ""
 *
 * // 以下生成 "\nORDER BY age DESC NULLS FIRST,num ASC"
 * orderBy("age DESC NULLS FIRST,num ASC");
 * orderBy(["age DESC NULLS FIRST", "num ASC"]);
 * orderBy([
 *    { key: "age", asc: false, nullLast: false },
 *    { key: "num", asc: true },
 *  ]);
 *
 * ```
 */
export function orderBy(by?: Constructable<OrderByParam | void>): string {
  if (typeof by === "function") by = by();
  let sql = "";
  if (!by) return sql;
  if (typeof by === "string") {
    sql += "\nORDER BY " + by;
  } else if (by instanceof Array) {
    if (by.length) {
      sql += "\nORDER BY " + handlerOrderValue(by[0]);
      for (let i = 1; i < by.length; i++) sql += "," + handlerOrderValue(by[i]);
    }
  } else {
    sql += "\nORDER BY " + handlerOrderValue(by);
  }
  return sql;
}
function handlerOrderValue(value: string | OrderBehavior) {
  if (typeof value === "string") return value;
  let target: string;
  if (value.target) {
    target = value.target;
  } else {
    target = value.asc ? "ASC" : "DESC";
    if (value.nullLast !== undefined) target += value.nullLast ? " NULLS LAST" : " NULLS FIRST";
  }

  return value.key + " " + target;
}
