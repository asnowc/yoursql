import { SqlSelectable, DbTable, InferQueryResult, SqlQueryStatement } from "./selectable.ts";
import { genNewColumns, genOderBy } from "./_statement.ts";
import type { ColumnsSelected, RowsOrder, SelectColumns, TableType } from "./type.ts";

interface AddTableFn<T extends TableType> {
  <Q extends SqlSelectable<any>, A extends InferQueryResult<Q>>(
    tb: Q,
    columns?: undefined,
    option?: SelectTableOption
  ): Select<T>;
  <Q extends SqlSelectable<any>, A extends InferQueryResult<Q>, C extends ColumnsSelected<A>>(
    tb: Q,
    columns: C,
    option?: SelectTableOption
  ): Select<T & SelectColumns<A, C>>;
}
interface JoinTableFn<T extends TableType, ExtraOption extends object = {}> {
  <Q extends SqlSelectable<any>, A extends InferQueryResult<Q>>(
    tb: Q,
    columns: undefined,
    option: ExtraOption & SelectTableOption
  ): JoinSelect<T>;
  <Q extends SqlSelectable<any>, A extends InferQueryResult<Q>, C extends ColumnsSelected<A>>(
    tb: Q,
    columns: C,
    option: ExtraOption & SelectTableOption
  ): JoinSelect<T & SelectColumns<A, C>>;
}
/** @public */
export interface SelectFilterOption<T extends object> {
  orderBy?: RowsOrder<T>;
  orderNullRule?: "FIRST" | "LAST";
  where?: string;
  offset?: number;
  limit?: number;
}
// export interface GroupBySelect<T extends TableType> extends SqlSelectable<T> {
//   addColumn<A extends TableType>(add: { [key in keyof A]: string }): GroupBySelect<T & A>;
// }

/** @public */
export interface FinalSelect<T extends TableType> extends SqlSelectable<T> {
  toQuery(option?: SelectFilterOption<T>): SqlQueryStatement<T>;
}
/** @public */
export interface JoinSelect<T extends TableType> extends FinalSelect<T> {
  addColumns<A extends TableType>(add: { [key in keyof A]: string }): FinalSelect<T & A>;
  crossJoin: JoinTableFn<T>;
  naturalJoin: JoinTableFn<T>;
  innerJoin: JoinTableFn<T, { on: string }>;
  leftJoin: JoinTableFn<T, { on: string }>;
  rightJoin: JoinTableFn<T, { on: string }>;
  fullJoin: JoinTableFn<T, { on: string }>;

  // groupBy(columns: (keyof T)[]): GroupBySelect<T>;
}
/** @public */
export interface Select<T extends TableType> extends JoinSelect<T> {
  /** 选择表 */
  select: AddTableFn<T>;
}

/** @public */
export const createSelect: AddTableFn<{}> = function createSelect(
  tb: SqlSelectable<any> | string,
  columns?: ColumnsSelected<any>,
  option?: SelectTableOption
): Select<any> {
  let select = createSelectMap(tb, columns, option).selects;
  return new SelectImpl(select) as any;
};
class SelectImpl<T extends TableType> extends SqlSelectable<T> implements Select<T> {
  get columns(): Iterable<string> {
    return this.getColumns();
  }
  private *getColumns() {
    for (const { columns } of this.tableList.values()) {
      yield* columns.keys();
    }
    yield* this.addedColumns.keys();
  }
  constructor(private tableList: Map<string, TableSelected>, private addedColumns: Map<string, string> = new Map()) {
    super();
  }
  toSelect(): string {
    return "(" + this.toString() + ")";
  }
  toString() {
    let tables: string[] = [];
    let join = "";
    let selectColumns: string[] = [];
    const size = this.tableList.size;
    for (const [tableAs, { columns, from, on, type }] of this.tableList) {
      let tableStr: string = tableAs === from ? from : from + " AS " + tableAs;
      if (type) {
        join += "\n" + type + " " + tableStr;
        if (on) join += " ON " + on;
      } else {
        tables.push(tableStr);
      }

      if (size === 1 && tableAs === from) {
        for (const [column, oldName] of columns) {
          if (!oldName || oldName == column) selectColumns.push(column);
          else selectColumns.push(oldName + " AS " + column);
        }
      } else {
        for (const [column, oldName] of columns) {
          if (!oldName || oldName === column) selectColumns.push(tableAs + "." + column);
          else selectColumns.push(tableAs + "." + oldName + " AS " + column);
        }
      }
    }
    for (const [asName, columnStr] of this.addedColumns) {
      if (asName === columnStr) selectColumns.push(asName);
      else selectColumns.push(columnStr + " AS " + asName);
    }
    if (selectColumns.length === 0) throw new Error("Columns 为空");
    let sql = `SELECT ${selectColumns.join(", ")}\nFROM ${tables.join(", ")}` + join;

    return sql;
  }
  #joinOn(
    type: string,
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption & { on: string }
  ) {
    let { selects, tbInfo } = createSelectMap(tb, columns, option, this.tableList);
    tbInfo.type = type;
    tbInfo.on = option.on;
    const next = new SelectImpl(selects, new Map(this.addedColumns));
    Object.defineProperty(next, "select", { value: undefined, configurable: false, enumerable: false });
    return next;
  }
  #join(
    type: string,
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption
  ) {
    let { selects, tbInfo } = createSelectMap(tb, columns, option, this.tableList);
    tbInfo.type = type;
    const next = new SelectImpl(selects, new Map(this.addedColumns));
    Object.defineProperty(next, "select", { value: undefined, configurable: false, enumerable: false });
    return next;
  }
  fullJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption & { on: string }
  ): JoinSelect<any> {
    return this.#joinOn("FULL JOIN", tb, columns, option);
  }
  innerJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption & { on: string }
  ): JoinSelect<any> {
    return this.#joinOn("INNER JOIN", tb, columns, option);
  }
  leftJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption & { on: string }
  ): JoinSelect<any> {
    return this.#joinOn("LEFT JOIN", tb, columns, option);
  }
  rightJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption & { on: string }
  ): JoinSelect<any> {
    return this.#joinOn("RIGHT JOIN", tb, columns, option);
  }

  naturalJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption
  ): JoinSelect<any> {
    return this.#join("NATURAL JOIN", tb, columns, option);
  }
  crossJoin(
    tb: SqlSelectable<any> | string,
    columns: ColumnsSelected<any> | undefined,
    option: JoinTableOption
  ): JoinSelect<any> {
    return this.#join("CROSS JOIN", tb, columns, option) as JoinSelect<any>;
  }
  select(tb: SqlSelectable<any> | string, columns?: ColumnsSelected<any>, option?: SelectTableOption): Select<any> {
    let select = createSelectMap(tb, columns, option, this.tableList).selects;
    const obj = new SelectImpl(select, new Map(this.addedColumns));

    return obj as any;
  }
  addColumns(add: { [key: string]: string }): Select<any> {
    for (const [asNewName, columnStr] of Object.entries(add)) {
      if (this.addedColumns.has(asNewName)) throw new Error();
      this.addedColumns.set(asNewName, columnStr);
    }
    return this as any;
  }

  toQuery(option: SelectFilterOption<T> = {}): SqlQueryStatement<T> {
    const { where, orderNullRule } = option;
    let sql = this.toString();
    if (where) sql += "\nWHERE " + where;
    const orderBy = option.orderBy;
    if (orderBy) sql += genOderBy(orderBy, orderNullRule);
    if (option.limit) sql += "\nLIMIT " + option.limit;
    if (option.offset) sql += "\nOFFSET " + option.offset;

    return new SqlQueryStatement(sql, Array.from(this.columns));
  }
}

/** @public */
export interface SelectTableOption {
  tableAs?: string;
}
interface JoinTableOption extends SelectTableOption {}

function createSelectMap(
  tb: SqlSelectable<any> | string,
  columns: ColumnsSelected<any> | undefined,
  option: SelectTableOption = {},
  selects?: Map<string, TableSelected>
): { selects: Map<string, TableSelected>; tbInfo: TableSelected } {
  let select = new Map<string, TableSelected>(selects);
  let tableAs: string;
  let tbInfo: TableSelected;

  if (typeof tb === "string") {
    throw new Error("tb 应是 SqlSelectable 类型");
    // if (typeof columns !== "object") throw new Error("缺少 option.columns");
    // const newColumns = genSelectAsColumns(columns);
    // tableAs = option.tableAs ?? tb;
    // tbInfo = { table: tb, columns: newColumns };
  } else {
    const from = tb.toSelect();
    if (tb instanceof DbTable) {
      tableAs = option.tableAs ?? from;
    } else {
      tableAs = option.tableAs ?? "t" + select.size;
    }
    if (columns) {
      const newColumns = genNewColumns(columns, tb.columns);
      tbInfo = { from, columns: newColumns };
    } else tbInfo = { from, columns: new Map() };
  }

  if (select.has(tableAs)) throw new TableRepeatError(tableAs);
  select.set(tableAs, tbInfo);

  return { selects: select as any, tbInfo: tbInfo as any };
}
class TableRepeatError extends Error {
  constructor(tableName: string | number) {
    super("Table name '" + tableName + "' repeated");
  }
}
interface TableSelected {
  /** newName -> oldName */
  columns: Map<string, string | null>;
  from: string;

  type?: string;
  on?: string;
}

// interface SqlFrom<T extends object> {
//   from<A extends object>(table: SqlSelectable<A>): SqlFrom<T & A>;
// }
// declare function from<T extends SqlSelectable<any>[]>(...table: T): Select<MergeSelectable<T>>;

// type MergeSelectable<T extends any[]> = T extends [SqlSelectable<infer P>, ...infer Q] ? P & MergeSelectable<Q> : {};
