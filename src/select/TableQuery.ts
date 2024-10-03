import { selectColumnsOrTable } from "./_statement.ts";
import { SqlValuesCreator, SqlRaw } from "../sql_value/sql_value.ts";
import { ColumnsSelected, ColumnsSelectAs, SelectColumns, UpdateRowValue, TableType } from "./type.ts";
import { createSelect, Select, SelectTableOption } from "./select.ts";
import { DbTable, SqlQueryStatement } from "./selectable.ts";

/** @public */
export class DbTableQuery<
  T extends TableType = Record<string, any>,
  C extends TableType = Partial<T>
> extends DbTable<T> {
  constructor(readonly name: string, columns: readonly string[], private statement: SqlValuesCreator) {
    super(name, columns);
  }
  /** 选择全部列 */
  select(columns?: undefined, option?: SelectTableOption): Select<{}>;
  /** 选择全部列 */
  select(columns: "*", option?: SelectTableOption): Select<T>;
  /** 选择表中的列并重命名 */
  select<R extends ColumnsSelectAs<T>>(columns: R, option?: SelectTableOption): Select<SelectColumns<T, R>>;
  select(columns: ColumnsSelected<any> | undefined, option?: SelectTableOption): Select<any> {
    return createSelect(this, columns as ColumnsSelected<any>, option);
  }
  insert(values: C[] | SqlQueryStatement<C>, option?: InsertOption<T>): string {
    let insertCol: readonly string[];
    let valuesStr: string;
    if (values instanceof Array) {
      if (values.length === 0) throw new Error("值不能为空");
      insertCol = Object.keys(values[0]);
      valuesStr = `VALUES\n${this.statement.objectListToValuesList(values, insertCol as (keyof C)[])}`;
    } else if (values instanceof SqlQueryStatement) {
      // todo 验证 values.columns 和 this.columns 是否匹配
      valuesStr = values.toSelect();
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
    const { where } = option;
    const updateKey = Object.entries(values);
    if (updateKey.length === 0) throw new Error("值不能为空");

    let setList: string[] = [];
    for (const [k, v] of updateKey) {
      if (v === undefined) continue;
      setList.push(k + " = " + this.statement.toSqlStr(v));
    }

    let sql = `UPDATE ${this.name}\nSET ${setList.join(",\n")}`;
    if (where) sql += genWhere(where);
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
    let sql = "DELTE FROM " + this.name;
    if (option.where) sql += genWhere(option.where);
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
  where?: string;
}
/** @public */
export interface UpdateOption {
  where?: string;
}
/** @public */
export interface DeleteOption {
  where?: string;
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

function genWhere(where: string) {
  return "\nWHERE " + where;
}
