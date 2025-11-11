import { ConditionParam, Constructable, selectColumns, SelectParam } from "../util.ts";
import { createUpdateSetFromObject, whereToString } from "../_statement.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainAfterConflict, ChainInsert, ChainInsertAfterValues, ChainInsertReturning } from "./insert_chain.ts";

export class InsertChain extends SqlStatement implements ChainInsert {
  constructor(private sql: string) {
    super();
  }
  values(statement: Constructable<string | readonly string[]>): ChainInsertAfterValues {
    if (typeof statement === "function") statement = statement();
    switch (typeof statement) {
      case "object":
        if (statement instanceof Array) {
          statement = statement.join(",\n");
        } else {
          throw new TypeError("参数 statement 类型错误");
        }
        break;
      case "string":
        break;
      default:
        throw new TypeError("参数 statement 类型错误");
    }

    return new InsertChain(this.sql + `\nVALUES\n${statement}`);
  }
  select(statement: Constructable<string>): ChainInsertAfterValues {
    if (typeof statement === "function") statement = statement();
    return new InsertChain(this.sql + `\n${statement}`);
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
  onConflict(onConflict: Constructable<readonly string[] | string>): ChainAfterConflict {
    if (typeof onConflict === "function") onConflict = onConflict();

    if (typeof onConflict !== "string") onConflict = onConflict.join(",");
    let sql = this.genSql() + `\nON CONFLICT (${onConflict})`;

    return new InsertAfterOnConflict(sql);
  }
  where(where: Constructable<ConditionParam | void>): ChainInsertReturning {
    const sql = whereToString(where);
    return new InsertChain(this.genSql() + sql);
  }
  genSql(): string {
    return this.sql;
  }
}

class InsertAfterOnConflict implements ChainAfterConflict {
  constructor(private sql: string) {}
  doUpdate(set: Constructable<string | string[] | Record<string, string>>): ChainInsertReturning {
    if (typeof set === "function") set = set();

    let sql: string;

    switch (typeof set) {
      case "object": {
        if (set instanceof Array) {
          sql = "\nDO UPDATE SET " + set.join(", ");
        } else {
          sql = "\nDO UPDATE " + createUpdateSetFromObject(set);
        }
        break;
      }
      case "string":
        sql = "\nDO UPDATE " + set;
        break;
      default:
        throw new TypeError("参数 set 类型错误");
    }

    return new InsertChain(this.sql + sql);
  }
  doNotThing(): ChainInsertReturning {
    return new InsertChain(this.sql + " DO NOTHING");
  }
  toString(): string {
    return this.sql;
  }
}
