/** @public */
export abstract class SqlStatement {
  /** 获取 SQL 语句 */
  abstract toString(): string;
}
/**
 * 可选择项。可以是 table、查询结果等，它能被 select 语句选择
 * @example
 * ```ts
 * declare const item: SqlStatementDataset
 * await query(`select * from ${item.toSelect()}`)
 *
 * ```
 * @public
 */
export interface SqlSelectable {
  /**
   * 转成子选择语句, 你可以使用 select form xxx 选择
   * 如果是 table 则是 table name
   * 如果是 选择语句，则是 (xxx)
   */
  toSelect(): string;
}

/** @public */
export abstract class SqlStatementDataset<T> extends SqlStatement implements SqlSelectable {
  /**
   * 转成子选择语句, 你可以使用 select form xxx 选择
   * 如果是 table 则是 table name
   * 如果是 选择语句，则是 (xxx)
   */
  toSelect(): string {
    return "(" + this.toString() + ")";
  }
}

/** @public */
export class SqlTextStatementDataset<T> extends SqlStatementDataset<T> {
  constructor(readonly sql: string) {
    super();
  }
  toString(): string {
    return this.sql;
  }
}
/**
 * 推断查询结果的类型
 * @public
 */
export type InferQueryResult<T> = T extends SqlStatementDataset<infer P> ? P : never;
