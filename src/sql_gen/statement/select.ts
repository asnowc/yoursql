import { Constructable, selectColumns, SelectParam, TableType } from "../util.ts";
import { condition, selectableToString } from "../_statement.ts";
import { SqlSelectable } from "../SqlStatement.ts";
import {
  ChainSelectAfterFirstFrom,
  ChainSelect,
  ChainSelectAfterFrom,
  SelectJoinOption,
} from "./select_chain.ts";
import { SqlSelectChain } from "../select/query_chain_select.ts";

export function select<T extends TableType>(columns: "*"): ChainSelect<T>;
export function select<T extends TableType>(
  columns: Constructable<{ [key in keyof T]: string | boolean }>,
): ChainSelect<T>;
export function select<T extends TableType>(columns: Constructable<string | string[]>): ChainSelect<T>;
export function select<T extends TableType>(
  columns: Constructable<string | string[] | { [key in keyof T]: string | boolean }>,
): ChainSelect<T>;
export function select<T extends TableType>(columns: Constructable<SelectParam>): ChainSelect<T> {
  if (typeof columns === "function") columns = columns();

  return new SelectChainAfterSelect("SELECT " + selectColumns(columns));
}
class SelectChainAfterSelect<T extends TableType> implements ChainSelect<T> {
  constructor(sql: string) {
    this.#sql = sql;
  }
  #sql: string;
  from(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFirstFrom<T> {
    return new SelectChain<T>(this.#sql + "\nFROM " + selectableToString(selectable));
  }
  toString() {
    return this.#sql;
  }
}

class SelectChain<T extends TableType> extends SqlSelectChain<T> implements ChainSelectAfterFirstFrom<T> {
  constructor(sql: string) {
    super(sql);
  }
  from(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T> {
    return new SelectChain<T>(this.genSql() + ", " + selectableToString(selectable));
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

  naturalJoin(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nNATURAL JOIN ", selectable);
  }
  crossJoin(selectable: Constructable<SqlSelectable | string>): ChainSelectAfterFrom<T> {
    return joinToString(this.genSql() + "\nCROSS JOIN ", selectable);
  }
}

function joinToString<T extends TableType>(
  sql: string,
  selectable: Constructable<SqlSelectable | string>,
  options?: SelectJoinOption,
) {
  sql += selectableToString(selectable);
  if (options?.on) {
    let on = options.on;
    if (typeof on === "function") on = on();
    sql += " ON " + condition(on);
  }
  return new SelectChain<T>(sql);
}
