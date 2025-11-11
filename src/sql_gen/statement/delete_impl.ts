import { ConditionParam, Constructable, SelectParam } from "../util.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainDelete, ChainDeleteAfterUsing, ChainDeleteReturning } from "./delete_chain.ts";
import { returningToString, whereToString } from "../_statement.ts";

export class DeleteChain extends SqlStatement implements ChainDelete {
  constructor(readonly sql: string) {
    super();
  }

  using(...from: Constructable<string>[]): ChainDeleteAfterUsing {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nUSING ${textList.join(", ")}`;
    return new DeleteChain(sql);
  }
  returning<R extends {}>(returns: Constructable<SelectParam | "*">): SqlStatementDataset<R> {
    return new SqlTextStatementDataset(this.genSql() + returningToString(returns));
  }
  where(where: Constructable<ConditionParam | void>): ChainDeleteReturning {
    const sql = whereToString(where);
    return new DeleteChain(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}
