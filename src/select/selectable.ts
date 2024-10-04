import { TableType } from "./type.ts";

const SQL_SELECTABLE = Symbol("SQL Selectable");

/**
 * 可选择项。可以是 table、查询结果等，它能被 select 语句选择
 * @example
 * ```ts
 * declare const item: SqlSelectable<any>
 * await query(`select * from ${item.toSelect()}`)
 *
 * ```
 * @public
 */
export abstract class SqlSelectable<T extends TableType> {
  constructor(columns: ArrayLike<string> | Iterable<string>) {
    // Reflect.set(this, SQL_SELECTABLE, undefined);

    let readonlyColumns: string[];
    if (typeof (columns as any)[Symbol.iterator] === "function") {
      let iterable = columns as Iterable<string>;
      readonlyColumns = [];
      let iter = iterable[Symbol.iterator]();
      let i = 0;
      let item = iter.next();
      while (!item.done) {
        readonlyColumns[i++] = item.value;
        item = iter.next();
      }
      // readonlyColumns.length = i;
    } else {
      let arrayLike = columns as ArrayLike<string>;
      readonlyColumns = new Array(arrayLike.length);
      // readonlyColumns.length = arrayLike.length;
      for (let i = 0; i < arrayLike.length; i++) {
        readonlyColumns[i] = arrayLike[i];
      }
    }

    this.columns = readonlyColumns;
  }
  /** 结果列 */
  readonly columns: readonly string[];
  /**
   * 转成子选择语句, 你可以使用 select form xxx 选择
   * 如果是 table 则是 table name
   * 如果是 选择语句，则是 (xxx)
   */
  abstract toSelect(): string;
  /** 获取 SQL 语句 */
  abstract toString(): string;
  /** 保留以推断类型 */
  private declare [SQL_SELECTABLE]: T;
}
/**
 * 数据库表
 * @public
 */
export class DbTable<T extends TableType> extends SqlSelectable<T> {
  constructor(name: string, columns: readonly (keyof T)[]);
  constructor(readonly name: string, columns: string[]) {
    if (!(columns instanceof Array)) columns = Object.keys(columns);
    super(columns);
  }
  toSelect(): string {
    return this.name;
  }
  toString(): string {
    return this.name;
  }
}

/**
 * SELECT 以及 UPDATE、DELETE、INSERT INTO 带结果的 SQL 语句
 * @public
 */
export class SqlQueryStatement<T extends TableType = TableType> extends SqlSelectable<T> {
  constructor(private sql: string, columns: readonly string[]) {
    super(columns);
  }
  toString(): string {
    return this.sql;
  }
  toSelect(): string {
    return "(" + this.toString() + ")";
  }
}
/**
 * 推断查询结果的类型
 * @public
 */
export type InferQueryResult<T> = T extends SqlSelectable<infer P> ? (P extends TableType ? P : never) : never;
