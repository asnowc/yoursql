import { ConditionParam, Constructable, OrderByParam } from "../util.ts";
import { ColumnsSelected, TableType } from "./type.ts";

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
export interface ChainSelectLimit<T extends TableType> extends SqlStatementDataset<T> {
  limit(limit?: number | bigint, offset?: number | bigint): SqlStatementDataset<T>;
}
/** @public */
export interface ChainSelectOrderBy<T extends TableType> extends ChainSelectLimit<T> {
  orderBy(param: Constructable<OrderByParam | void>): ChainSelectLimit<T>;
}
/** @public */
export interface ChainSelectHaving<T extends TableType> extends ChainSelectOrderBy<T> {
  having(param: Constructable<ConditionParam | void>): ChainSelectLimit<T>;
}
/** @public */
export interface ChainSelectGroupBy<T extends TableType> extends ChainSelectOrderBy<T> {
  groupBy(columns: string | string[]): ChainSelectHaving<T>;
}
/** @public */
export interface ChainSelectWhere<T extends TableType> extends ChainSelectGroupBy<T> {
  where(param: Constructable<ConditionParam | void>): ChainSelectGroupBy<T>;
}

/** @public */
export interface ChainModifyReturning<T extends TableType = {}> extends SqlStatement {
  returning(columns: "*"): SqlStatementDataset<T>;
  returning(columns: Constructable<ColumnsSelected<T> | string>): SqlStatementDataset<Record<string, any>>;
  returning<R extends TableType>(columns: Constructable<ColumnsSelected<R> | string>): SqlStatementDataset<R>;
}
/** @public */
export interface ChainModifyWhere<T extends TableType = {}> extends ChainModifyReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T>;
}

/** @public */
export interface ChainConflictDo<T extends TableType = {}> {
  doNotThing(): ChainModifyReturning<T>;
  /**
   * 需要注意 SQL 注入
   */
  doUpdate(set: Constructable<string | { [key in keyof T]?: string }>): ChainModifyWhere<T>;
  toString(): string;
}

/** @public */
export interface ChainOnConflict<T extends TableType = {}> extends ChainModifyReturning<T> {
  onConflict(option: Constructable<readonly (keyof T)[] | string>): ChainConflictDo<T>;
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
