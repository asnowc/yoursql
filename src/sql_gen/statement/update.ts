import { ConditionParam, Constructable, where as createWhere, selectColumns, SelectParam, TableType } from "../util.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainUpdate, ChainUpdateAfterForm, ChainUpdateReturning } from "./update_chain.ts";

export function update<T extends TableType = {}>(): ChainUpdate<T> {}

class UpdateChain<T extends TableType = {}> extends SqlStatement implements ChainUpdate<T> {
  constructor(readonly sql: string) {
    super();
  }
  from(...from: Constructable<string>[]): ChainUpdateAfterForm<T> {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nFROM ${textList.join(", ")}`;
    return new UpdateChain<T>(sql);
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

  where(where: Constructable<ConditionParam | void>): ChainUpdateReturning<T> {
    const sql = createWhere(where);
    return new UpdateChain(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}
