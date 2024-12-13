import { ConditionParam, Constructable, where as createWhere } from "../util.ts";
import { createUpdateSetFromObject, selectColumnsOrTable } from "./_statement.ts";
import {
  SqlStatementDataset,
  SqlStatement,
  SqlTextStatementDataset,
  ChainModifyWhere,
  ChainOnConflict,
  ChainConflictDo,
  ChainModifyReturning,
} from "./query_chain_abstract.ts";
import { ColumnsSelected, TableType } from "./type.ts";

export class SqlChainModify<T extends TableType = {}>
  extends SqlStatement
  implements ChainOnConflict<T>, ChainModifyWhere<T>
{
  constructor(readonly sql: string) {
    super();
  }
  returning<R extends {}>(returns: Constructable<ColumnsSelected<any> | "*">): SqlStatementDataset<R> {
    if (typeof returns === "function") returns = returns();
    let columnsStr: string;
    if (returns === "*") {
      columnsStr = "*";
    } else {
      const res = selectColumnsOrTable(returns as Parameters<typeof selectColumnsOrTable>[0]);
      columnsStr = res.sqlColumns;
    }
    let sql = this.toString() + "\nRETURNING " + columnsStr;
    return new SqlTextStatementDataset(sql);
  }
  onConflict(onConflict: Constructable<readonly string[] | string>): ChainConflictDo<T> {
    if (typeof onConflict === "function") onConflict = onConflict();

    if (typeof onConflict !== "string") onConflict = onConflict.join(",");
    let sql = this.toString() + `\nON CONFLICT (${onConflict})`;

    return new SqlInsertConflictBranch<T>(sql);
  }
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T> {
    const sql = createWhere(where);
    return new SqlChainModify(this.toString() + sql);
  }
  toString(): string {
    return this.sql;
  }
}

export class SqlInsertConflictBranch<T extends TableType = {}> implements ChainConflictDo<T> {
  constructor(readonly sql: string) {}
  doUpdate(set?: Constructable<string | { [key: string]: string | undefined }>): ChainModifyWhere<T> {
    if (typeof set === "function") set = set();

    let sql = this.sql;

    if (typeof set === "object") {
      sql += "\nDO UPDATE ";
      sql += createUpdateSetFromObject(set);
    } else if (set) sql += "DO UPDATE SET\n" + set;
    else sql += "DO NOTHING";

    return new SqlChainModify(sql);
  }
  doNotThing(): ChainModifyReturning<T> {
    return new SqlChainModify(this.sql + " DO NOTHING");
  }
}
