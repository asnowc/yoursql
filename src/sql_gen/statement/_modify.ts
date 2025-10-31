import { ConditionParam, Constructable, where as createWhere, selectColumns, SelectParam, TableType } from "../util.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainInsert } from "./insert_chain.ts";
import { ChainUpdate } from "./update_chain.ts";
import { ChainDelete } from "./delete_chain.ts";

export class SqlChainModify<T extends TableType = {}>
  extends SqlStatement
  implements ChainInsert<T>, ChainUpdate<T>, ChainDelete<T>
{
  constructor(readonly sql: string) {
    super();
  }
  from(...from: Constructable<string>[]): SqlChainModify<T> {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nFROM ${textList.join(", ")}`;
    return new SqlChainModify<T>(sql);
  }
  using(...from: Constructable<string>[]): SqlChainModify<T> {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nUSING ${textList.join(", ")}`;
    return new SqlChainModify<T>(sql);
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
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T> {
    const sql = createWhere(where);
    return new SqlChainModify(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}

export interface ChainModifyReturning<T extends TableType = {}> extends SqlStatement {
  returning(columns: "*"): SqlStatementDataset<T>;
  returning(columns: Constructable<SelectParam>): SqlStatementDataset<Record<string, any>>;
  returning<R extends TableType>(columns: Constructable<SelectParam>): SqlStatementDataset<R>;
}
