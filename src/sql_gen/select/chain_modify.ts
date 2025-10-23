import { ConditionParam, Constructable, SelectParam } from "../util.ts";
import { TableType } from "./type.ts";
import { SqlStatement, SqlStatementDataset } from "./chain_base.ts";

/** @public */
export interface ChainModifyReturning<T extends TableType = {}> extends SqlStatement {
  returning(columns: "*"): SqlStatementDataset<T>;
  returning(columns: Constructable<SelectParam>): SqlStatementDataset<Record<string, any>>;
  returning<R extends TableType>(columns: Constructable<SelectParam>): SqlStatementDataset<R>;
}

/** @public */
export interface ChainAfterConflictDo<T extends TableType = {}> {
  doNotThing(): ChainModifyReturning<T>;
  /**
   * 需要注意 SQL 注入
   */
  doUpdate(set: Constructable<string | { [key in keyof T]?: string }>): ChainModifyReturning<T>;
  toString(): string;
}

/** @public */
export interface ChainUpdateWhere<T extends TableType = {}> extends ChainModifyReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T>;
}
/** @public */
export interface ChainDeleteWhere<T extends TableType = {}> extends ChainModifyReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainModifyReturning<T>;
}

/** @public */
export interface ChainInsert<T extends TableType = {}> extends ChainModifyReturning<T> {
  onConflict(option: Constructable<readonly (keyof T)[] | string>): ChainAfterConflictDo<T>;
}

/** @public */
export interface ChainUpdate<T extends TableType = {}> extends ChainUpdateWhere<T> {
  /**
   * @example
   * ```ts
   *
   * table.update({age: "3", name: "'hi'", count:"b.count"}, "a").from("table1 AS b", "(SELECT k FROM table2) AS c").where(...)
   * // UPDATE table AS a
   * // FROM table1 AS b, (SELECT k FROM table2) AS c
   * // SET a.age=3, a.name='hi', a.count=b.count
   * // WHERE ...
   * ```
   */
  from(...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]): ChainUpdateWhere<T>;
}

/** @public */
export interface ChainDelete<T extends TableType = {}> extends ChainDeleteWhere<T> {
  /** 
   * @example
   * ```ts
   *
   * table.delete().using("table1 AS b", "(SELECT k FROM table2) AS c").where(...)
   * // DELETE FROM table
   * // USING table1 AS b, (SELECT k FROM table2) AS c
   * // WHERE ...
   * ```
   */
  using(...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]): ChainDeleteWhere<T>;
}
