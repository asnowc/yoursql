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
  /**
   * 转成子选择语句, 你可以使用 select form xxx 选择
   * 如果是 table 则是 table name
   * 如果是 选择语句，则是 (xxx)
   */
  abstract toSelect(): string;
  /** 获取 SQL 语句 */
  abstract toString(): string;
  /** 保留以推断类型 */
  protected declare [SQL_SELECTABLE]: T;
}

/**
 * SELECT 以及 UPDATE、DELETE、INSERT INTO 带结果的 SQL 语句
 * @public
 */
export class SqlQueryStatement<T extends TableType = TableType> extends SqlSelectable<T> {
  constructor(sql: string | SqlQueryStatement) {
    super();
    this.#sql = sql.toString();
  }
  #sql: string;
  toString(): string {
    return this.#sql;
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
