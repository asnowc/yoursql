import { ConditionParam, Constructable } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface ChainDelete extends ChainDeleteAfterUsing {
  /**
   * @example
   * ```ts
   *
   * using("table1 AS b", "(SELECT k FROM table2) AS c").where(...)
   * // USING table1 AS b, (SELECT k FROM table2) AS c
   * // WHERE ...
   * ```
   */
  using(...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]): ChainDeleteAfterUsing;
}
/** @public */
export interface ChainDeleteAfterUsing extends ChainDeleteReturning {
  where(where: Constructable<ConditionParam | void>): ChainDeleteReturning;
}
/** @public */
export interface ChainDeleteReturning extends ChainModifyReturning {}
