import { ConditionParam, Constructable, where as createWhere, selectColumns, SelectParam, TableType } from "../util.ts";
import { createUpdateSetFromObject } from "../_statement.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainAfterConflict, ChainInsert, ChainInsertReturning } from "./insert_chain.ts";

export function insertInto(): ChainInsert {}

class InsertChain<T extends TableType = {}> extends SqlStatement implements ChainInsert<T> {
  constructor(readonly sql: string) {
    super();
  }
  returning<R extends {}>(returns: Constructable<SelectParam | "*">): SqlStatementDataset<R> {
    if (typeof returns === "function") returns = returns();
    let columnsStr: string;
    if (returns === "*") {
      columnsStr = "*";
    } else {
      columnsStr = selectColumns(returns);
    }
    let sql = this.genSql() + "\nRETURNING " + columnsStr;
    return new SqlTextStatementDataset(sql);
  }
  onConflict(onConflict: Constructable<readonly string[] | string>): ChainAfterConflict<T> {
    if (typeof onConflict === "function") onConflict = onConflict();

    if (typeof onConflict !== "string") onConflict = onConflict.join(",");
    let sql = this.genSql() + `\nON CONFLICT (${onConflict})`;

    return new SqlInsertConflictBranch<T>(sql);
  }
  where(where: Constructable<ConditionParam | void>): ChainInsertReturning<T> {
    const sql = createWhere(where);
    return new InsertChain(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}

class SqlInsertConflictBranch<T extends TableType = {}> implements ChainAfterConflict<T> {
  constructor(readonly sql: string) {}
  doUpdate(set?: Constructable<string | { [key: string]: string | undefined }>): ChainInsertReturning<T> {
    if (typeof set === "function") set = set();

    let sql = this.sql;

    if (typeof set === "object") {
      sql += "\nDO UPDATE ";
      sql += createUpdateSetFromObject(set);
    } else if (set) sql += "DO UPDATE\n" + set;
    else sql += "DO NOTHING";

    return new InsertChain(sql);
  }
  doNotThing(): ChainInsertReturning<T> {
    return new InsertChain(this.sql + " DO NOTHING");
  }
  toString(): string {
    return this.sql;
  }
}
