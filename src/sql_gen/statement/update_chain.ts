import { ConditionParam, Constructable, TableType } from "../util.ts";
import { ChainModifyReturning } from "./_modify.ts";

/** @public */
export interface ChainUpdate<T extends TableType = {}> extends ChainUpdateAfterForm<T> {
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
  from(
    ...table: (Constructable<string> | { selectable: Constructable<string>; as: string })[]
  ): ChainUpdateAfterForm<T>;
}

/** @public */
export interface ChainUpdateAfterForm<T extends TableType = {}> extends ChainUpdateReturning<T> {
  where(where: Constructable<ConditionParam | void>): ChainUpdateReturning<T>;
}

/** @public */
export interface ChainUpdateReturning<T extends TableType = {}> extends ChainModifyReturning<T> {}
