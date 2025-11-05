import { ConditionParam, Constructable, selectColumns, SelectParam, TableType } from "../util.ts";
import { SqlStatementDataset, SqlStatement, SqlTextStatementDataset } from "../SqlStatement.ts";
import { ChainUpdate, ChainUpdateAfterForm, ChainUpdateAfterSet, ChainUpdateReturning } from "./update_chain.ts";
import { createUpdateSetFromObject, whereToString } from "../_statement.ts";
/** @public */
export interface UpdateOption {
  asName?: string;
}
/**
 * @public
 * @example
 * ```ts
 *  update("table1 AS t").where("t.id = b.id") // UPDATE table1 AS t WHERE t.id = b.id
 *  update("table1",{ asName: "t" }).set({ k:"'v'"}) // UPDATE table1 AS t SET t.k = 'v'
 *  update("table1").where("id = 1") // UPDATE table1 AS t WHERE id = 1
 * ```
 */
export function update<T extends TableType>(table: string, options?: UpdateOption): ChainUpdate<T> {
  let sql = `UPDATE ${table}`;
  if (options?.asName) {
    sql += ` AS ${options.asName}`;
  }
  return new UpdateChain(sql, { ...options });
}

class UpdateChain extends SqlStatement implements ChainUpdate {
  constructor(
    private sql: string,
    private readonly options: Readonly<UpdateOption> = {},
  ) {
    super();
  }
  from(...from: Constructable<string>[]): ChainUpdateAfterForm {
    const textList = from.map((f, i) => {
      if (typeof f === "function") return f();
      return f;
    });
    const sql = this.genSql() + `\nFROM ${textList.join(", ")}`;
    return new UpdateChain(sql);
  }
  /**
   * @example
   * ```ts
   * // SET age=3, name='hi', count=b.count
   * set({age: "3", name: "'hi'", count:"b.count"})
   * set(["age = 3", "name = 'hi'", "count = b.count"])
   * set("age = 3, name = 'hi', count = b.count")
   *
   * ```
   */
  set(values: Constructable<Record<string, string | undefined> | string[] | string>): ChainUpdateAfterSet {
    if (typeof values === "function") values = values();

    switch (typeof values) {
      case "object": {
        if (values instanceof Array) {
          let sql = values.join(", ");
          return new UpdateChain(this.sql + " " + sql);
        } else {
          let sql = createUpdateSetFromObject(values, this.options?.asName ? this.options.asName : undefined);
          return new UpdateChain(this.sql + " " + sql);
        }
      }
      case "string":
        return new UpdateChain(this.sql + " SET\n" + values);
      default:
        throw new TypeError("参数 values 类型错误");
    }
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

  where(where: Constructable<ConditionParam | void>): ChainUpdateReturning {
    const sql = whereToString(where);
    return new UpdateChain(this.genSql() + sql);
  }

  genSql(): string {
    return this.sql;
  }
}
