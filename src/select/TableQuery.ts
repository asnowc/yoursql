import { selectColumnsOrTable } from "./_statement.ts";
import { SqlValuesCreator } from "../sql_value/sql_value.ts";
import { ColumnsSelected, SelectColumns, UpdateRowValue, TableType } from "./type.ts";
import { CurrentWhere, Selection } from "./select.ts";
import { DbTable, SqlQueryStatement } from "./selectable.ts";
import { where, getObjectListKeys, ConditionParam, Constructable } from "../util.ts";

/** @public */
export class DbTableQuery<
  T extends TableType = Record<string, any>,
  C extends TableType = Partial<T>
> extends DbTable<T> {
  constructor(name: string, private statement: SqlValuesCreator) {
    super(name);
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
  select<R extends { [key in keyof T]?: boolean }>(
    columns: Constructable<R>,
    as?: string
  ): CurrentWhere<{
    [key in keyof R]: key extends keyof T ? T[key] : unknown;
  }>;
  /** 选择单表- 所有类型 */
  select<R extends {}>(
    columns: Constructable<{ [key in keyof R]?: key extends keyof T ? string | boolean : string } | string>,
    as?: string
  ): CurrentWhere<R>;
  select(columns: "*" | Record<string, any>, as?: string): CurrentWhere<TableType> {
    return this.fromAs(as).select(columns);
  }
  /**
   * @example
   * ```ts
   * table.insert({age:18, name:"hi"}) // INSERT INTO table(age,name) VALUES (18, 'hi')
   * table.insert([{age:18, name:"hi"}, {age:17, name:"hh"}]) // INSERT INTO table(age,name) VALUES(18, 'hi'), (17, 'hh')
   * ```
   */
  insert(values: Constructable<C | C[]>, option?: InsertOption<T>): string;
  /**
   * @example
   * ```ts
   * table.insert("VALUES (18, 'hi'), (17, 'hh')", ["age","name"]) // INSERT INTO table(age,name) VALUES(18, 'hi'), (17, 'hh')
   * ```
   */
  insert(values: Constructable<string>, columns: string[], option?: InsertOption<T>): string;
  insert(
    values: Constructable<C | C[] | string>,
    columns_option?: string[] | InsertOption<T>,
    option?: InsertOption<T>
  ): string {
    if (typeof values === "function") values = values();

    let columnStr: string;
    let valuesStr: string;

    if (typeof values === "string") {
      valuesStr = values;
      if (typeof columns_option === "string") columnStr = columns_option;
      else if (columns_option instanceof Array) {
        if (columns_option.length === 0) throw new Error("插入列为空");
        columnStr = columns_option.join(",");
      } else throw new Error("当 values 为 string 类型时，必须指定 columns");
    } else {
      let insertCol: readonly string[];
      option = columns_option as InsertOption<T>;

      if (typeof values === "object") {
        if (values instanceof Array) {
          if (values.length === 0) throw new Error("值不能为空");
          insertCol = Array.from(getObjectListKeys(values));
          valuesStr = `VALUES\n${this.statement.objectListToValuesList(values, insertCol)}`;
        } else if (values instanceof SqlQueryStatement) {
          // todo 验证 values.columns 和 this.columns 是否匹配
          valuesStr = values.toString();
          insertCol = values.columns;
        } else {
          insertCol = Object.keys(values);
          valuesStr = `VALUES\n(${this.statement.objectToValues(values, insertCol)})`;
        }
      } else throw new Error("values 应该是 Array 或 TableQuery 类型");
      if (insertCol.length === 0) throw new Error("插入列不能为空");
      columnStr = insertCol.join(",");
    }

    let sql = `INSERT INTO ${this.name} (${columnStr})\n${valuesStr}`;

    if (option) {
      let { updateValues, conflict, where: inputWhere } = option;

      if (conflict) {
        if (typeof conflict !== "string") conflict = conflict.join(",");
        sql += `\nON CONFLICT (${conflict})`;

        if (typeof updateValues === "function") updateValues = updateValues();
        if (updateValues) {
          const updateKey = Object.entries(updateValues);
          sql += `\nDO UPDATE SET\n${updateKey.map(([key, v = "EXCLUDED." + key]) => key + " = " + v).join(",\n")}`;
        } else sql += "DO NOTHING";

        sql += where(inputWhere);
      }
    }
    return sql;
  }
  insertWithResult<R extends ColumnsSelected<T>>(
    values: Constructable<C | C[]>,
    returns: R,
    option?: InsertOption<T>
  ): SqlQueryStatement<SelectColumns<T, R>>;
  insertWithResult<R extends ColumnsSelected<T>>(
    values: Constructable<string>,
    returns: R,
    columns: string | string[],
    option?: InsertOption<T>
  ): SqlQueryStatement<SelectColumns<T, R>>;
  insertWithResult<R extends ColumnsSelected<T>>(
    values: Constructable<C | C[] | string>,
    returns: R,
    columns?: string | string[] | InsertOption<T>,
    option?: InsertOption<T>
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.insert(values as any, columns as any, option);
    return genRetuningSql(sql, returns) as SqlQueryStatement<SelectColumns<T, R>>;
  }

  /**
   * @example
   * ```ts
   * table.update("age=3, name='hi'") // "UPDATE table SET age=3, name='hi'"
   * table.update({age:3, name:"hi"}) // "UPDATE table SET age=3, name='hi'"
   * ```
   */
  update(values: Constructable<UpdateRowValue<T> | string>, option: UpdateOption = {}): string {
    if (typeof values === "function") values = values();
    let setStr: string;
    if (typeof values === "string") setStr = values;
    else {
      const updateKey = Object.entries(values);
      let setList: string[] = [];
      for (const [k, v] of updateKey) {
        if (v === undefined) continue;
        setList.push(k + " = " + this.statement.toSqlStr(v));
      }
      setStr = setList.join(",\n");
    }

    if (!setStr) throw new Error("值不能为空");

    let sql = `UPDATE ${this.name}\nSET ${setStr}`;
    sql += where(option.where);
    return sql;
  }
  updateWithResult<R extends ColumnsSelected<T>>(
    values: Constructable<UpdateRowValue<T>>,
    returns: R,
    option?: UpdateOption
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.update(values, option);
    return genRetuningSql(sql, returns) as SqlQueryStatement<SelectColumns<T, R>>;
  }

  delete(option: DeleteOption = {}): string {
    let sql = "DELETE FROM " + this.name;
    sql += where(option.where);
    return sql;
  }
  deleteWithResult<R extends ColumnsSelected<T>>(
    returns: ColumnsSelected<T> | "*" = "*",
    option?: DeleteOption
  ): SqlQueryStatement<SelectColumns<T, R>> {
    let sql = this.delete(option);
    return genRetuningSql(sql, returns) as SqlQueryStatement<SelectColumns<T, R>>;
  }
}

/** @public */
export interface InsertOption<T extends object> {
  conflict?: (keyof T)[] | string;
  updateValues?: Constructable<{ [key in keyof T]?: undefined | String | T[key] } | string | void>;
  where?: Constructable<ConditionParam | void>;
}
/** @public */
export interface UpdateOption {
  where?: Constructable<ConditionParam | void>;
}
/** @public */
export interface DeleteOption {
  where?: Constructable<ConditionParam | void>;
}

function genRetuningSql(sql: string, returns: ColumnsSelected<any>): SqlQueryStatement {
  let columnsStr: string;
  if (returns === "*") {
    columnsStr = "*";
  } else {
    const res = selectColumnsOrTable(returns as Parameters<typeof selectColumnsOrTable>[0]);
    columnsStr = res.sqlColumns;
  }
  sql += "\nRETURNING " + columnsStr;
  return new SqlQueryStatement(sql);
}
