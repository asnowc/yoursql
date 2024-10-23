import { selectColumnsOrTable } from "./_statement.ts";
import { SqlValuesCreator, SqlRaw } from "../sql_value/sql_value.ts";
import { ColumnsSelected, SelectColumns, UpdateRowValue, TableType } from "./type.ts";
import { CurrentWhere, Selection } from "./select.ts";
import { DbTable, SqlQueryStatement } from "./selectable.ts";
import { where, getObjectListKeys, ConditionParam } from "../util.ts";

/** @public */
export class DbTableQuery<
  T extends TableType = Record<string, any>,
  C extends TableType = Partial<T>
> extends DbTable<T> {
  constructor(name: string, columns: readonly string[], private statement: SqlValuesCreator) {
    super(name, columns);
  }
  fromAs(as?: string): Selection {
    return new Selection(this, as);
  }
  /** 选择单表全部列 */
  select(columns: "*", as?: string): CurrentWhere<T>;
  /**
   * 选择单表
   * @param columns - 对象选择
   */
  select<R extends { [key in keyof T]?: string | boolean } | Record<string, string>>(
    columns: R,
    as?: string
  ): CurrentWhere<{
    [key in keyof R]: R[key] extends boolean
      ? key extends keyof T
        ? T[key]
        : unknown
      : R[key] extends keyof T
      ? T[R[key]]
      : unknown;
  }>;
  /** 选择单表- 所有类型 */
  select<R extends {}>(
    columns: "*" | string[] | { [key in keyof R]?: key extends keyof T ? string | boolean : string },
    as?: string
  ): CurrentWhere<R>;
  select(columns: "*" | string[] | Record<string, any>, as?: string): CurrentWhere<TableType> {
    return this.fromAs(as).select(columns);
  }
  insert(values: C[] | SqlQueryStatement<C>, option?: InsertOption<T>): string {
    let insertCol: readonly string[];
    let valuesStr: string;
    if (values instanceof Array) {
      if (values.length === 0) throw new Error("值不能为空");
      insertCol = Array.from(getObjectListKeys(values));
      valuesStr = `VALUES\n${this.statement.objectListToValuesList(values, insertCol)}`;
    } else if (values instanceof SqlQueryStatement) {
      // todo 验证 values.columns 和 this.columns 是否匹配
      valuesStr = values.toString();
      insertCol = values.columns;
    } else throw new Error("values 应该是 Array 或 TableQuery 类型");
    if (insertCol.length === 0) throw new Error("插入列不能为空");

    let sql = `INSERT INTO ${this.name} (${insertCol.join(",")})\n${valuesStr}`;

    if (option) {
      const { updateValues, conflict, where } = option;
      if (conflict) {
        sql += `\nON CONFLICT (${conflict.join(",")})`;
        if (updateValues) {
          const updateKey = Object.entries(updateValues);
          sql += `\nDO UPDATE SET\n${updateKey.map(([key, v = "EXCLUDED." + key]) => key + " = " + v).join(",\n")}`;
        } else sql += "DO NOTHING";
        if (where) sql += "\nWHERE " + where;
      }
    }
    return sql;
  }
  insertWithResult<R extends ColumnsSelected<T>>(
    values: C[] | SqlQueryStatement<C>,
    returns: R,
    option?: InsertOption<T>
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.insert(values, option);
    return genRetuningSql(
      sql,
      returns,
      values instanceof SqlQueryStatement ? values.columns : this.columns
    ) as SqlQueryStatement<SelectColumns<T, R>>;
  }

  update(values: UpdateRowValue<T>, option: UpdateOption = {}): string {
    const updateKey = Object.entries(values);
    if (updateKey.length === 0) throw new Error("值不能为空");

    let setList: string[] = [];
    for (const [k, v] of updateKey) {
      if (v === undefined) continue;
      setList.push(k + " = " + this.statement.toSqlStr(v));
    }

    let sql = `UPDATE ${this.name}\nSET ${setList.join(",\n")}`;
    if (option.where) sql += where(option.where);
    return sql;
  }
  updateWithResult<R extends ColumnsSelected<T>>(
    values: UpdateRowValue<T>,
    returns: R,
    option?: UpdateOption
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.update(values, option);
    return genRetuningSql(
      sql,
      returns,
      values instanceof SqlQueryStatement ? values.columns : this.columns
    ) as SqlQueryStatement<SelectColumns<T, R>>;
  }

  delete(option: DeleteOption = {}): string {
    let sql = "DELETE FROM " + this.name;
    if (option.where) sql += where(option.where);
    return sql;
  }
  deleteWithResult<R extends ColumnsSelected<T>>(
    returns: ColumnsSelected<T> | "*" = "*",
    option?: DeleteOption
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.delete(option);
    return genRetuningSql(sql, returns, this.columns) as SqlQueryStatement<SelectColumns<T, R>>;
  }
}

/** @public */
export interface InsertOption<T extends object> {
  conflict?: (keyof T)[];
  updateValues?: { [key in keyof T]?: undefined | SqlRaw | T[key] };
  where?: ConditionParam;
}
/** @public */
export interface UpdateOption {
  where?: ConditionParam;
}
/** @public */
export interface DeleteOption {
  where?: ConditionParam;
}

function genRetuningSql(
  sql: string,
  returns: ColumnsSelected<any>,
  tableColumns: readonly string[]
): SqlQueryStatement {
  let columnsStr: string;
  let columns: readonly string[];
  if (returns === "*") {
    columns = tableColumns;
    columnsStr = "*";
  } else {
    const res = selectColumnsOrTable(returns as Parameters<typeof selectColumnsOrTable>[0]);
    columnsStr = res.sqlColumns;
    columns = res.columns;
  }
  sql += "\nRETURNING " + columnsStr;
  return new SqlQueryStatement(sql, columns);
}
