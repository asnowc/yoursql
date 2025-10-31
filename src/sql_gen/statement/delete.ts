import { ConditionParam, Constructable, where as createWhere, selectColumns, SelectParam, TableType } from "../util.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainDelete, ChainDeleteAfterUsing, ChainDeleteReturning } from "./delete_chain.ts";

export function deleteFrom<T extends TableType = {}>(): ChainDelete<T> {}

class DeleteChain<T extends TableType = {}> extends SqlStatement implements ChainDelete<T> {
  constructor(readonly sql: string) {
    super();
  }

  using(...from: Constructable<string>[]): ChainDeleteAfterUsing<T> {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nUSING ${textList.join(", ")}`;
    return new DeleteChain<T>(sql);
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
  where(where: Constructable<ConditionParam | void>): ChainDeleteReturning<T> {
    const sql = createWhere(where);
    return new DeleteChain(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}
