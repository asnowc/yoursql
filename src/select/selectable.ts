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
  constructor() {
    // Reflect.set(this, SQL_SELECTABLE, undefined);
  }
  /** 结果列 */
  abstract readonly columns: Iterable<string>;
  /**
   * 转成子选择语句, 你可以使用 select form xxx 选择
   * 如果是 table 则是 table name
   * 如果是 选择语句，则是 (xxx)
   */
  abstract toSelect(): string;
  /** 获取 SQL 语句 */
  abstract toString(): string;
  /** 保留以推断类型 */
  declare [SQL_SELECTABLE]: T;
}
/**
 * 数据库表
 * @public
 */
export class DbTable<T extends TableType> extends SqlSelectable<T> {
  /**
   * 表的列
   */
  readonly columns: readonly string[];
  constructor(readonly name: string, columns: readonly (keyof T)[]) {
    super();
    if (columns instanceof Array) this.columns = [...columns] as string[];
    else this.columns = Object.keys(columns);
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
  /** 结果列 */
  readonly columns: readonly string[];
  constructor(private sql: string, columns: readonly string[]) {
    super();
    this.columns = columns as any[];
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
