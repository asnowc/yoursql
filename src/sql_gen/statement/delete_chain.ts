import { ConditionParam, Constructable, TableType } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface ChainDelete<T extends TableType = {}> extends ChainDeleteAfterUsing<T> {
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
  using(
    ...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]
  ): ChainDeleteAfterUsing<T>;
}
/** @public */
export interface ChainDeleteAfterUsing<T extends TableType = {}> extends ChainDeleteReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainDeleteReturning<T>;
}
/** @public */
export interface ChainDeleteReturning<T extends TableType = {}> extends ChainModifyReturning<T> {}
