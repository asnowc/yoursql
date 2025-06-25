import { ConditionParam, Constructable, where as createWhere, selectColumns, SelectParam } from "../util.ts";
import { createUpdateSetFromObject } from "./_statement.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "./chain_base.ts";
import { ChainAfterConflictDo, ChainModifyReturning, ChainInsert, ChainDelete, ChainUpdate } from "./chain_modify.ts";
import { TableType } from "./type.ts";

export class SqlChainModify<T extends TableType = {}>
  extends SqlStatement
  implements ChainInsert<T>, ChainUpdate<T>, ChainDelete<T>
{
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
  onConflict(onConflict: Constructable<readonly string[] | string>): ChainAfterConflictDo<T> {
    if (typeof onConflict === "function") onConflict = onConflict();

    if (typeof onConflict !== "string") onConflict = onConflict.join(",");
    let sql = this.genSql() + `\nON CONFLICT (${onConflict})`;

    return new SqlInsertConflictBranch<T>(sql);
  }
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T> {
    const sql = createWhere(where);
    return new SqlChainModify(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}

export class SqlInsertConflictBranch<T extends TableType = {}> implements ChainAfterConflictDo<T> {
  constructor(readonly sql: string) {}
  doUpdate(set?: Constructable<string | { [key: string]: string | undefined }>): ChainModifyReturning<T> {
    if (typeof set === "function") set = set();

    let sql = this.sql;

    if (typeof set === "object") {
      sql += "\nDO UPDATE ";
      sql += createUpdateSetFromObject(set);
    } else if (set) sql += "DO UPDATE\n" + set;
    else sql += "DO NOTHING";

    return new SqlChainModify(sql);
  }
  doNotThing(): ChainModifyReturning<T> {
    return new SqlChainModify(this.sql + " DO NOTHING");
  }
  toString(): string {
    return this.sql;
  }
}
