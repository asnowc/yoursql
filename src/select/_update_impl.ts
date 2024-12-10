import { ConditionParam, Constructable, where as createWhere } from "../util.ts";
import { createUpdateSetFromObject, selectColumnsOrTable } from "./_statement.ts";
import { CurrentModifyWhere, CurrentOnConflict, CurrentOnConflictDo, CurrentReturn } from "./query_link.ts";
import { SqlQueryStatement } from "./selectable.ts";
import { ColumnsSelected, TableType } from "./type.ts";

export class AfterUpdateOrReturn<T extends TableType = {}>
  extends SqlQueryStatement<{}>
  implements CurrentOnConflict<T>, CurrentModifyWhere<T>
{
  returning<R extends {}>(returns: Constructable<ColumnsSelected<any> | "*">): SqlQueryStatement<R> {
    if (typeof returns === "function") returns = returns();
    let columnsStr: string;
    if (returns === "*") {
      columnsStr = "*";
    } else {
      const res = selectColumnsOrTable(returns as Parameters<typeof selectColumnsOrTable>[0]);
      columnsStr = res.sqlColumns;
    }
    let sql = this.toString() + "\nRETURNING " + columnsStr;
    return new SqlQueryStatement(sql);
  }
  onConflict(onConflict: Constructable<readonly string[] | string>): CurrentOnConflictDo<T> {
    if (typeof onConflict === "function") onConflict = onConflict();

    if (typeof onConflict !== "string") onConflict = onConflict.join(",");
    let sql = this.toString() + `\nON CONFLICT (${onConflict})`;

    return new AfterInsert<T>(sql);
  }
  where(where: Constructable<ConditionParam | void>): CurrentReturn<T> {
    const sql = createWhere(where);
    return new AfterUpdateOrReturn(this.toString() + sql);
  }
}
export class AfterInsert<T extends TableType = {}> implements CurrentOnConflictDo<T> {
  constructor(sql: string) {
    this.#sql = sql;
  }
  #sql: string;
  doUpdate(set?: Constructable<string | { [key: string]: string | undefined }>): CurrentModifyWhere<T> {
    if (typeof set === "function") set = set();

    let sql = this.toString();

    if (typeof set === "object") {
      sql += "\nDO UPDATE ";
      sql += createUpdateSetFromObject(set);
    } else if (set) sql += "DO UPDATE SET\n" + set;
    else sql += "DO NOTHING";

    return new AfterUpdateOrReturn(sql);
  }
  doNotThing(): CurrentReturn<T> {
    return new AfterUpdateOrReturn(this.#sql + " DO NOTHING");
  }
  toString(): string {
    return this.#sql;
  }
}
